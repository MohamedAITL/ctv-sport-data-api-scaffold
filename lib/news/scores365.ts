// 365scores' Arabic magazine — the football category the site links as
// /ar/news/magazine/category/كرة-قدم/.
//
// It replaces the old /web/news/ endpoint, which answered with three headlines,
// ignored paging and carried no article text. The magazine runs on WordPress:
// its feeds are disabled but the REST API is open, and it returns the full
// article body, the hero image and real paging.
import type { NewsItem } from "@/types/news";
import { encodeNewsId } from "./id";
import { decodeEntities } from "./rss";
import { isoOrNow } from "./date";

const API = "https://www.365scores.com/ar/news/magazine/wp-json/wp/v2/posts";
const FOOTBALL_CATEGORY = 13; // "كرة قدم", the category in that URL

interface WpPost {
  link?: string;
  date_gmt?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  content?: { rendered?: string };
  _embedded?: { "wp:featuredmedia"?: Array<{ source_url?: string }> };
}

const text = (html: string | undefined): string =>
  decodeEntities((html ?? "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

export async function fetchScores365News(page = 1, pageSize = 12): Promise<NewsItem[]> {
  const qs = new URLSearchParams({
    categories: String(FOOTBALL_CATEGORY),
    per_page: String(pageSize),
    page: String(page),
    _embed: "1",
  });
  const r = await fetch(`${API}?${qs}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    },
  });
  // Paging past the end answers 400 rather than an empty list.
  if (r.status === 400) return [];
  if (!r.ok) throw new Error(`365scores magazine ${r.status}`);
  const posts = (await r.json()) as WpPost[];
  return posts.flatMap((p) => {
    const url = p.link;
    const title = text(p.title?.rendered);
    if (!url || !title) return [];
    const body = p.content?.rendered ?? null;
    return [{
      id: encodeNewsId(url),
      source: "scores365" as const,
      title,
      url,
      image: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null,
      publishedAt: isoOrNow(p.date_gmt ? `${p.date_gmt}Z` : null),
      summary: text(p.excerpt?.rendered) || null,
      body,
      bodyIsHtml: Boolean(body),
    }];
  });
}
