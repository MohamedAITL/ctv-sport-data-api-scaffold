// beIN SPORTS Arabic.
//
// The site is a Next.js app whose news list is client-rendered, so there is no
// feed and no article links in the HTML. It reads its own content API (a
// Kontent.ai adapter) which answers one request with the list AND each
// article's body and hero image — no second fetch per article. The "key" the
// site sends with it is the literal string "qwerty": a formality, not a
// credential. robots.txt allows /ar-mena/ (it disallows /en/, /ar/, /us/ and
// the other locales, not this one).
import type { NewsItem } from "@/types/news";
import { encodeNewsId } from "./id";

const API = "https://prod-kontentadapter.beinsports.com/kp/domain/items/article";
const SITE = "https://www.beinsports.com/ar-mena/article";
const ELEMENTS = [
  "title", "subtitle", "teaser", "body", "publication_date", "url_slug",
  "hero_image_manager", "hero_image_manager__element",
].join(",");

interface RawBein {
  title?: string;
  teaser?: string;
  subtitle?: string;
  body?: { text?: string };
  publication_date?: string;
  url_slug?: string; // a JSON array, as a string
  hero_image_manager?: { hero_image_manager__element?: string };
}

function query(extra: Record<string, string>): string {
  return new URLSearchParams({
    depth: "3",
    desiredLanguage: "ar-mena",
    filterByLanguage: "ar-mena",
    "system.workflow_step[in]": "draft,published",
    order: "elements.publication_date[desc]",
    elements: ELEMENTS,
    ...extra,
  }).toString();
}

async function get(qs: string): Promise<RawBein[]> {
  const r = await fetch(`${API}?${qs}`, {
    headers: { Accept: "application/json", "x-kp-api-key": "qwerty", Referer: "https://www.beinsports.com/" },
  });
  if (!r.ok) throw new Error(`beIN ${r.status}`);
  const j = (await r.json()) as { items?: RawBein[] };
  return j.items ?? [];
}

// Both fields arrive as JSON encoded inside a string.
const parseJson = <T,>(raw: string | undefined): T | null => {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
};

const slugOf = (a: RawBein): string | null => parseJson<string[]>(a.url_slug)?.[0] ?? null;

const imageOf = (a: RawBein): string | null => {
  const el = parseJson<Array<{ externalLink?: string; internalLink?: string }>>(
    a.hero_image_manager?.hero_image_manager__element
  );
  return el?.[0]?.externalLink ?? el?.[0]?.internalLink ?? null;
};

function toItem(a: RawBein): NewsItem | null {
  const slug = slugOf(a);
  if (!a.title || !slug) return null;
  const url = `${SITE}/${encodeURI(slug)}`;
  return {
    id: encodeNewsId(url),
    source: "bein",
    title: a.title,
    url,
    image: imageOf(a),
    publishedAt: a.publication_date ? new Date(a.publication_date).toISOString() : new Date().toISOString(),
    summary: a.teaser ?? a.subtitle ?? null,
    body: a.body?.text ?? null,
    bodyIsHtml: Boolean(a.body?.text),
  };
}

export async function fetchBein(page = 1, pageSize = 12): Promise<NewsItem[]> {
  const items = await get(query({ limit: String(pageSize), skip: String((page - 1) * pageSize) }));
  return items.map(toItem).filter((i): i is NewsItem => i !== null);
}

/** The list already carries the body, so this is only for a direct link. */
export async function fetchBeinArticle(url: string): Promise<NewsItem | null> {
  const slug = decodeURIComponent(url.split("/").pop() ?? "");
  if (!slug) return null;
  const items = await get(query({ "elements.url_slug[any]": slug, limit: "1" }));
  return items.length ? toItem(items[0]) : null;
}
