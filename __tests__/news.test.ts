import { encodeNewsId, decodeNewsId, isAllowedArticleUrl, sourceOfUrl } from "@/lib/news/id";
import { fetchHesport } from "@/lib/news/hesport";
import { fetchElbotola } from "@/lib/news/elbotola";
import { fetchBein } from "@/lib/news/bein";
import { fetchHespress } from "@/lib/news/hespress";

describe("news ids and the host allowlist", () => {
  const url = "https://www.hesport.com/some-article-123.html";

  it("round-trips an article url", () => {
    expect(decodeNewsId(encodeNewsId(url))).toBe(url);
  });

  // The id decodes to a URL the server then fetches, so the allowlist is the
  // only thing standing between this route and an SSRF primitive.
  it("rejects ids pointing anywhere other than the three publishers", () => {
    expect(decodeNewsId(encodeNewsId("https://evil.example.com/x"))).toBeNull();
    expect(decodeNewsId(encodeNewsId("http://169.254.169.254/latest/meta-data/"))).toBeNull();
    expect(decodeNewsId(encodeNewsId("file:///etc/passwd"))).toBeNull();
    expect(decodeNewsId("not-base64-$$$")).toBeNull();
  });

  it("does not let a lookalike domain through", () => {
    expect(isAllowedArticleUrl("https://hesport.com.evil.net/x")).toBe(false);
    expect(isAllowedArticleUrl("https://www.elbotola.com/a.html")).toBe(true);
  });

  it("maps a url back to its source", () => {
    expect(sourceOfUrl("https://www.hesport.com/a")).toBe("hesport");
    expect(sourceOfUrl("https://www.elbotola.com/a")).toBe("elbotola");
    expect(sourceOfUrl("https://www.365scores.com/ar/news/x")).toBe("scores365");
    expect(sourceOfUrl("https://example.com/a")).toBeNull();
  });
});

const RSS = `<rss><channel>
<item>
<title><![CDATA[رايا يشيد برد فعل أرسنال]]></title>
<link>https://www.hesport.com/article-1.html</link>
<pubDate>Mon, 19 Oct 2026 09:00:56 +0000</pubDate>
<dc:creator><![CDATA[هسبورت - د ب أ]]></dc:creator>
<category><![CDATA[أخبار]]></category>
<description><![CDATA[<p>ملخص قصير</p>]]></description>
<content:encoded><![CDATA[<p>النص الكامل للمقال.</p>
<p>L&#8217;article <a href="x">رايا</a> est apparu en premier sur <a href="y">هسبورت</a>.</p>]]></content:encoded>
<enclosure url="https://i1.hesport.com/wp-content/uploads/2026/10/pic.jpg" />
</item>
</channel></rss>`;

describe("hesport RSS", () => {
  const real = global.fetch;
  afterEach(() => { global.fetch = real; });

  it("maps an item, keeping the syndicated body", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, text: async () => RSS })) as unknown as typeof fetch;
    const [item] = await fetchHesport();
    expect(item.source).toBe("hesport");
    expect(item.title).toBe("رايا يشيد برد فعل أرسنال");
    expect(item.author).toBe("هسبورت - د ب أ");
    expect(item.section).toBe("أخبار");
    expect(item.image).toContain("pic.jpg");
    expect(item.publishedAt.startsWith("2026-10-19")).toBe(true);
    expect(item.bodyIsHtml).toBe(true);
    expect(item.body).toContain("النص الكامل للمقال");
  });

  it("drops the WordPress syndication footer from the body", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, text: async () => RSS })) as unknown as typeof fetch;
    const [item] = await fetchHesport();
    expect(item.body).not.toContain("est apparu en premier sur");
  });
});

describe("elbotola feed", () => {
  const real = global.fetch;
  afterEach(() => { global.fetch = real; });

  const payload = {
    results: [
      {
        title: "عنوان عربي",
        absolute_url: "https://www.elbotola.com/article/a.html",
        lang: "ar",
        // seconds since epoch, not milliseconds and not a date string
        pub_date: 1792416900,
        image: { default_path: "//images2.elbotola.com/article/x_default.jpeg", thumb_path: "//i/x_thumb.jpeg" },
        tags: [{ name: "برشلونة", content_type: "team", image_path: "//images.elbotola.com/l/b.png", absolute_url: "https://www.elbotola.com/t/b" }],
      },
      { title: "Titre français", absolute_url: "https://www.elbotola.com/article/b.html", lang: "fr", pub_date: 1792416900 },
    ],
  };

  it("reads pub_date as seconds, not milliseconds", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => payload })) as unknown as typeof fetch;
    const [item] = await fetchElbotola();
    // Treating the value as ms would date every article to 1970.
    expect(item.publishedAt.startsWith("2026-")).toBe(true);
  });

  it("takes the image path out of the image object and makes it absolute", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => payload })) as unknown as typeof fetch;
    const [item] = await fetchElbotola();
    expect(item.image).toBe("https://images2.elbotola.com/article/x_default.jpeg");
    expect(item.tags?.[0].image).toBe("https://images.elbotola.com/l/b.png");
  });

  it("keeps only the Arabic edition of a story", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => payload })) as unknown as typeof fetch;
    const items = await fetchElbotola();
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("عنوان عربي");
  });
});

describe("beIN SPORTS Arabic", () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  // Shape verified live: the list call answers with the body and hero image
  // inline, and both url_slug and the image element arrive as JSON inside a
  // string.
  const item = {
    title: "التعادل يخيّم على مواجهة خيتافي ورايو فايكانو",
    teaser: "خيّم التعادل الإيجابي على المواجهة.",
    body: { text: "<p>وبادر ألفارو غارسيا بافتتاح التسجيل.</p>" },
    publication_date: "2026-10-19T22:15:18.117Z",
    url_slug: JSON.stringify(["التعادل-يخي-م-2026-10-19", "autogenerated"]),
    hero_image_manager: {
      hero_image_manager__element: JSON.stringify([
        { externalLink: "https://prod-media.beinsports.com/image/x.jpg", internalLink: "https://blob/x.jpg" },
      ]),
    },
  };

  const mock = (payload: unknown, seen?: string[]) => {
    global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
      seen?.push(url);
      void init;
      return { ok: true, json: async () => payload };
    }) as unknown as typeof fetch;
  };

  it("maps an article, preferring the public image URL over the blob one", async () => {
    const seen: string[] = [];
    mock({ items: [item] }, seen);
    const [a] = await fetchBein();
    expect(a.source).toBe("bein");
    expect(a.title).toContain("خيتافي");
    expect(a.image).toBe("https://prod-media.beinsports.com/image/x.jpg");
    expect(a.body).toContain("ألفارو غارسيا");
    expect(a.publishedAt).toBe("2026-10-19T22:15:18.117Z");
    // the article URL is built from the slug, and must survive the id round-trip
    expect(decodeURIComponent(a.url)).toBe("https://www.beinsports.com/ar-mena/article/التعادل-يخي-م-2026-10-19");
    expect(decodeNewsId(a.id)).toBe(a.url);
    expect(seen[0]).toContain("skip=0");
  });

  it("pages with skip, and drops an item with no slug", async () => {
    const seen: string[] = [];
    mock({ items: [item, { title: "بلا رابط" }] }, seen);
    const out = await fetchBein(3, 12);
    expect(out).toHaveLength(1);
    expect(seen[0]).toContain("skip=24");
  });

  it("is a known source and an allowed host", () => {
    expect(sourceOfUrl("https://www.beinsports.com/ar-mena/article/x")).toBe("bein");
    expect(isAllowedArticleUrl("https://www.beinsports.com/ar-mena/article/x")).toBe(true);
    expect(isAllowedArticleUrl("https://beinsports.com.evil.net/x")).toBe(false);
  });
});

describe("hespress sport feed", () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  it("reads the same WordPress shape as hesport, under its own source key", async () => {
    const xml = `<rss><channel><item>
      <title><![CDATA[هجمات الحوثيين تلغي رالي السعودية]]></title>
      <link>https://www.hespress.com/x-123.html</link>
      <pubDate>Tue, 20 Oct 2026 03:29:00 +0000</pubDate>
      <category><![CDATA[رياضة]]></category>
      <media:content url="https://i1.hespress.com/wp-content/uploads/2023/11/rally.jpg" />
      <content:encoded><![CDATA[<p>أعلن الاتحاد السعودي للسيارات الإلغاء.</p>]]></content:encoded>
    </item></channel></rss>`;
    global.fetch = jest.fn(async () => ({ ok: true, text: async () => xml })) as unknown as typeof fetch;
    const [a] = await fetchHespress();
    expect(a.source).toBe("hespress");
    expect(a.title).toBe("هجمات الحوثيين تلغي رالي السعودية");
    expect(a.image).toContain("rally.jpg");
    expect(a.body).toContain("الاتحاد السعودي");
    expect(sourceOfUrl(a.url)).toBe("hespress");
  });
});
