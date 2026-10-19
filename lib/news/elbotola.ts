// elbotola.com has no RSS; its site reads a public JSON newsfeed, which is what
// we use. The feed carries no article text, so the body is read on demand from
// the article's own JSON-LD NewsArticle (publisher-provided structured data).
import type { NewsItem, NewsTag } from "@/types/news";
import { encodeNewsId } from "./id";
import { articleFromJsonLd } from "./jsonld";

const FEED = "https://api.elbotola.com/newsfeed/v3/";

interface EbTag {
  name?: string;
  content_type?: string;
  image_path?: string | null;
  absolute_url?: string | null;
}
interface EbImage {
  default_path?: string | null;
  thumb_path?: string | null;
}
interface EbItem {
  title?: string;
  lang?: string;
  absolute_url?: string;
  image?: EbImage | string | null;
  pub_date?: number | string;
  tags?: EbTag[];
}

// Their image paths are protocol-relative ("//images.elbotola.com/...").
const abs = (u: string | null | undefined): string | null =>
  !u ? null : u.startsWith("//") ? "https:" + u : u;

// `image` is an object on feed items but a plain path on tags.
const imageOf = (img: EbItem["image"]): string | null => {
  if (!img) return null;
  if (typeof img === "string") return abs(img);
  return abs(img.default_path) ?? abs(img.thumb_path);
};

// `pub_date` is a Unix timestamp in SECONDS, not a date string — treating it as
// milliseconds dates every article to 1970 and sorts the feed wrongly.
const publishedAt = (v: number | string | undefined): string => {
  const n = typeof v === "string" ? Number(v) : v;
  if (!n || !Number.isFinite(n)) return new Date().toISOString();
  const ms = n < 1e12 ? n * 1000 : n;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

// The feed is multilingual and repeats each story in ar/fr/es/it/en. `lang=ar`
// narrows it server-side; the client-side check keeps stray translations out if
// that parameter is ever ignored.
export async function fetchElbotola(page = 1): Promise<NewsItem[]> {
  const r = await fetch(`${FEED}?page=${page}&lang=ar`, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`elbotola feed ${r.status}`);
  const d = (await r.json()) as { results?: EbItem[] };
  return (d.results ?? []).flatMap((it) => {
    const url = it.absolute_url;
    if (!url || !it.title) return [];
    if (it.lang && it.lang !== "ar") return [];
    const tags: NewsTag[] = (it.tags ?? []).map((t) => ({
      name: t.name ?? "",
      kind: t.content_type ?? "",
      image: abs(t.image_path),
      url: t.absolute_url ?? null,
    }));
    return [{
      id: encodeNewsId(url),
      source: "elbotola" as const,
      title: it.title,
      url,
      image: imageOf(it.image),
      publishedAt: publishedAt(it.pub_date),
      tags,
    }];
  });
}

/** Body + author/section for one elbotola article, from its JSON-LD. */
export async function fetchElbotolaArticle(url: string): Promise<Partial<NewsItem>> {
  return articleFromJsonLd(url);
}
