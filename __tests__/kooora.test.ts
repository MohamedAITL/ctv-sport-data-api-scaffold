import { fetchKooora, fetchKoooraArticle } from "@/lib/news/kooora";
import { isAllowedArticleUrl, sourceOfUrl } from "@/lib/news/id";

const page = (obj: unknown) =>
  `<html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(obj)}</script></body></html>`;

const listPage = page({
  props: {
    pageProps: {
      cards: [
        {
          headline: "يوفنتوس يعلن إصابة نجمه بخلع في الكتف",
          teaser: "مصائب السيدة العجوز لا تأتي فرادى",
          href: "/كرة-قدم/أخبار/slug/bltc810",
          publishDateString: "19 أكتوبر 2026",
          publishTimeString: "14:53",
          image: { src: "https://assets.kooora.com/x.jpg" },
        },
        { headline: "بدون رابط" }, // no href — must be skipped
      ],
    },
  },
});

describe("kooora list", () => {
  const real = global.fetch;
  afterEach(() => { global.fetch = real; });
  const mock = (html: string) => {
    global.fetch = jest.fn(async () => ({ ok: true, text: async () => html })) as unknown as typeof fetch;
  };

  it("reads cards out of __NEXT_DATA__ and makes hrefs absolute", async () => {
    mock(listPage);
    const items = await fetchKooora();
    expect(items).toHaveLength(1); // the card with no href is dropped
    expect(items[0].source).toBe("kooora");
    expect(items[0].url.startsWith("https://www.kooora.com/")).toBe(true);
    expect(items[0].image).toBe("https://assets.kooora.com/x.jpg");
    expect(items[0].summary).toBe("مصائب السيدة العجوز لا تأتي فرادى");
  });

  // The list gives an Arabic month name, not a timestamp.
  it("parses an Arabic date and time into an ISO timestamp", async () => {
    mock(listPage);
    const [item] = await fetchKooora();
    expect(item.publishedAt.startsWith("2026-10-19T14:53")).toBe(true);
  });

  it("falls back to now rather than 1970 on an unparseable date", async () => {
    mock(page({ props: { pageProps: { cards: [{ headline: "عنوان", href: "/a", publishDateString: "???" }] } } }));
    const [item] = await fetchKooora();
    expect(new Date(item.publishedAt).getFullYear()).toBeGreaterThan(2000);
  });

  it("throws when the page carries no __NEXT_DATA__", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, text: async () => "<html></html>" })) as unknown as typeof fetch;
    await expect(fetchKooora()).rejects.toThrow("__NEXT_DATA__");
  });

  it("takes the article body from the page's own props", async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      text: async () => page({ props: { pageProps: { data: { article: { body: "<p>النص الكامل</p>" } } } } }),
    })) as unknown as typeof fetch;
    const extra = await fetchKoooraArticle("https://www.kooora.com/a");
    expect(extra.body).toContain("النص الكامل");
    expect(extra.bodyIsHtml).toBe(true);
  });
});

describe("kooora is a recognised source", () => {
  it("is on the allowlist and maps back to its key", () => {
    expect(isAllowedArticleUrl("https://www.kooora.com/أخبار/x")).toBe(true);
    expect(sourceOfUrl("https://www.kooora.com/x")).toBe("kooora");
    expect(isAllowedArticleUrl("https://kooora.com.evil.net/x")).toBe(false);
  });
});
