// kooora.com has no feed, but it is a Next.js site that ships its own data in
// __NEXT_DATA__: the news page carries 30 cards, and an article page carries the
// full body in `data.article.body`. That is publisher-rendered data, not scraped
// markup, so it is far steadier than parsing the HTML.
import type { NewsItem } from "@/types/news";
import { encodeNewsId } from "./id";

const SITE = "https://www.kooora.com";
const NEWS_PATH = "/%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1"; // /أخبار
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

const AR_MONTHS: Record<string, number> = {
  "يناير": 0, "فبراير": 1, "مارس": 2, "أبريل": 3, "ابريل": 3, "مايو": 4,
  "يونيو": 5, "يونيه": 5, "يوليو": 6, "يوليه": 6, "أغسطس": 7, "اغسطس": 7,
  "سبتمبر": 8, "أكتوبر": 9, "اكتوبر": 9, "نوفمبر": 10, "ديسمبر": 11,
};

interface KoCard {
  headline?: string;
  teaser?: string;
  href?: string;
  publishDateString?: string;
  publishTimeString?: string;
  image?: { src?: string };
}

export async function nextData(url: string): Promise<Record<string, unknown>> {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!r.ok) throw new Error(`kooora ${r.status}`);
  const html = await r.text();
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error("kooora: no __NEXT_DATA__");
  return JSON.parse(m[1]) as Record<string, unknown>;
}

const pageProps = (d: Record<string, unknown>): Record<string, unknown> =>
  ((d.props as Record<string, unknown> | undefined)?.pageProps as Record<string, unknown>) ?? {};

// "19 أكتوبر 2026" + "14:53" -> ISO. Falls back to now rather than to 1970.
function parseArabicDate(date?: string, time?: string): string {
  const m = (date ?? "").trim().match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
  if (!m) return new Date().toISOString();
  const month = AR_MONTHS[m[2]];
  if (month === undefined) return new Date().toISOString();
  const [hh, mm] = (time ?? "00:00").split(":").map((x) => parseInt(x, 10) || 0);
  const d = new Date(Date.UTC(Number(m[3]), month, Number(m[1]), hh, mm));
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export async function fetchKooora(page = 1): Promise<NewsItem[]> {
  const url = page > 1 ? `${SITE}${NEWS_PATH}/${page}` : `${SITE}${NEWS_PATH}`;
  const cards = (pageProps(await nextData(url)).cards as KoCard[] | undefined) ?? [];
  return cards.flatMap((c) => {
    if (!c.href || !c.headline) return [];
    const abs = c.href.startsWith("http") ? c.href : SITE + c.href;
    return [{
      id: encodeNewsId(abs),
      source: "kooora" as const,
      title: c.headline,
      url: abs,
      image: c.image?.src ?? null,
      publishedAt: parseArabicDate(c.publishDateString, c.publishTimeString),
      summary: c.teaser ?? null,
    }];
  });
}

/** Full body + author for one kooora article, from the page's own props. */
export async function fetchKoooraArticle(url: string): Promise<Partial<NewsItem>> {
  const d = await nextData(url);
  const data = pageProps(d).data as Record<string, unknown> | undefined;
  const article = data?.article as Record<string, unknown> | undefined;
  const body = typeof article?.body === "string" ? article.body : null;
  return body ? { body, bodyIsHtml: true } : {};
}
