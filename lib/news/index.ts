// Aggregate the three publishers into one feed.
import type { NewsItem, NewsSourceKey } from "@/types/news";
import { fetchHesport } from "./hesport";
import { fetchElbotola, fetchElbotolaArticle } from "./elbotola";
import { fetchScores365News } from "./scores365";
import { fetchKooora, fetchKoooraArticle } from "./kooora";
import { articleFromJsonLd } from "./jsonld";
import { decodeNewsId, sourceOfUrl } from "./id";

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; items: NewsItem[] }>();

export interface NewsFeed {
  items: NewsItem[];
  failed: NewsSourceKey[]; // sources that did not answer, surfaced in the UI
}

// `refresh` skips the TTL so the button really re-reads the publishers; the
// cache still serves ordinary browsing and the "load more" paging.
export async function fetchNews(page = 1, refresh = false): Promise<NewsFeed> {
  const key = `page:${page}`;
  const hit = cache.get(key);
  if (!refresh && hit && Date.now() - hit.at < TTL_MS) return { items: hit.items, failed: [] };

  // One dead publisher must not blank the page. hesport and 365scores only
  // publish a first page, so deeper pages come from the paginated sources.
  const [he, eb, ko, s3] = await Promise.allSettled([
    page === 1 ? fetchHesport() : Promise.resolve([]),
    fetchElbotola(page),
    fetchKooora(page),
    page === 1 ? fetchScores365News() : Promise.resolve([]),
  ]);

  const failed: NewsSourceKey[] = [];
  const take = (r: PromiseSettledResult<NewsItem[]>, k: NewsSourceKey): NewsItem[] => {
    if (r.status === "fulfilled") return r.value;
    failed.push(k);
    return [];
  };

  const all = [
    ...take(he, "hesport"),
    ...take(eb, "elbotola"),
    ...take(ko, "kooora"),
    ...take(s3, "scores365"),
  ];

  // Same story can appear twice (e.g. a republished wire piece); key on URL.
  const byUrl = new Map<string, NewsItem>();
  for (const it of all) if (!byUrl.has(it.url)) byUrl.set(it.url, it);

  const items = Array.from(byUrl.values()).sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );
  if (items.length) cache.set(key, { at: Date.now(), items });
  return { items, failed };
}

/** One article with its body, resolved per source. Returns null if id is bad. */
export async function fetchNewsItem(id: string): Promise<NewsItem | null> {
  const url = decodeNewsId(id); // also enforces the host allowlist
  if (!url) return null;
  const source = sourceOfUrl(url);
  if (!source) return null;

  // hesport ships the whole article in its feed, so prefer the cached entry.
  for (const entry of Array.from(cache.values())) {
    const found = entry.items.find((i) => i.id === id);
    if (found && found.body) return found;
  }

  const base: NewsItem =
    (await findInFeed(id)) ?? {
      id,
      source,
      title: "",
      url,
      image: null,
      publishedAt: new Date().toISOString(),
    };

  if (base.body) return base;

  try {
    const extra =
      source === "kooora"
        ? { ...(await articleFromJsonLd(url).catch(() => ({}))), ...(await fetchKoooraArticle(url)) }
        : source === "elbotola"
        ? await fetchElbotolaArticle(url)
        : await articleFromJsonLd(url);
    return { ...base, ...extra, title: base.title || extra.summary?.slice(0, 80) || base.title };
  } catch {
    return base; // body unavailable — the page links to the source instead
  }
}

async function findInFeed(id: string): Promise<NewsItem | null> {
  for (const entry of Array.from(cache.values())) {
    const f = entry.items.find((i) => i.id === id);
    if (f) return f;
  }
  try {
    const { items } = await fetchNews(1);
    return items.find((i) => i.id === id) ?? null;
  } catch {
    return null;
  }
}
