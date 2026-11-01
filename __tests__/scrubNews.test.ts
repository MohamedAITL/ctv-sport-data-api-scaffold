import { scrubNews } from "@/lib/news/scrub";
import type { NewsItem } from "@/types/news";

const item = (over: Partial<NewsItem>): NewsItem => ({
  id: "a", source: "hesport", title: "عنوان", url: "https://www.hespress.com/a.html", image: "https://cdn.hespress.com/a.jpg", publishedAt: "2026-11-01", ...over,
});
const NAMES = /365\s?scores|hesport|hespress|elbotola|kooora|هسبورت|هسبريس|كووورة/i;

describe("news text never names its source", () => {
  it.each([
    ["تأكيدًا لـ365scores.. غياب سفيان رحيمي عن مباراة العين", "تأكيدًا.. غياب سفيان رحيمي عن مباراة العين"],
    ["وفي تصريحات خاصة لـ365Scores، كشف المحلل الفني", "وفي تصريحات خاصة، كشف المحلل الفني"],
    ["كشفت عنه مصادر خاصة لموقع 365Scores. وتسعى الإدارة", "كشفت عنه مصادر خاصة. وتسعى الإدارة"],
    ["وعلم موقع 365Scores من مصادره الخاصة أن ثنائيًا", "وعلم من مصادره الخاصة أن ثنائيًا"],
  ])("cleans %s", (from, to) => {
    expect(scrubNews(item({ title: from })).title).toBe(to);
  });

  it("drops the line a feed adds to the end of a summary", () => {
    const fr = "فاز الوداد على تطوان. L’article الوداد يفوز est apparu en premier sur هسبورت.";
    const en = "فاز الوداد.\nThe post الوداد يفوز appeared first on Hespress - هسبريس جريدة إلكترونية مغربية.";
    expect(scrubNews(item({ summary: fr })).summary).toBe("فاز الوداد على تطوان.");
    expect(scrubNews(item({ summary: en })).summary).toBe("فاز الوداد.");
  });

  it("keeps the writer and drops the source from a byline", () => {
    expect(scrubNews(item({ author: "هسبورت - عبد الله العلوي" })).author).toBe("عبد الله العلوي");
    expect(scrubNews(item({ author: "هسبورت" })).author).toBeNull();
    expect(scrubNews(item({ author: "محمد فنكار" })).author).toBe("محمد فنكار");
  });

  it("cleans an article's text but never its links or images", () => {
    const body = '<p>قال لموقع هسبريس إنه سعيد</p><img src="https://cdn.hespress.com/a.jpg"><a href="https://www.hespress.com/b">رابط</a>';
    const out = scrubNews(item({ body, bodyIsHtml: true })).body as string;
    expect(out).toContain("<p>قال إنه سعيد</p>");
    expect(out).toContain('src="https://cdn.hespress.com/a.jpg"');
    expect(out).toContain('href="https://www.hespress.com/b"');
  });

  it("leaves the item's own address alone, and ordinary text as it was", () => {
    const out = scrubNews(item({ title: "البطولة الاحترافية: الوداد يفوز على الرجاء" }));
    expect(out.title).toBe("البطولة الاحترافية: الوداد يفوز على الرجاء");
    expect(out.url).toContain("hespress");
  });

  it("drops a tag that was only the source", () => {
    const tag = (name: string) => ({ name, kind: "team", image: null, url: null });
    expect(scrubNews(item({ tags: [tag("هسبورت"), tag("الوداد")] })).tags).toEqual([tag("الوداد")]);
  });

  it("leaves nothing readable behind", () => {
    const out = scrubNews(item({ title: "كووورة تكشف: الوداد يفوز", summary: "نقلت جريدة هسبريس أن", author: "HESPRESS - وكالات", section: "هسبورت" }));
    expect(JSON.stringify([out.title, out.summary, out.author, out.section])).not.toMatch(NAMES);
  });
});
