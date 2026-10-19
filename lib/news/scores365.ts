// 365scores' own news feed. It returns only 3 items and ignores limit/page, so
// it is a garnish next to the other two sources. It carries no article text, so
// the detail page falls back to the JSON-LD description.
import type { NewsItem } from "@/types/news";
import { encodeNewsId } from "./id";

const API = "https://webws.365scores.com/web/news/";
const Q = "appTypeId=5&langId=27&timezoneName=Africa%2FCasablanca&userCountryId=127";

interface S365News {
  id?: number;
  publishDate?: string;
  title?: string;
  image?: string | null;
  url?: string;
}

export async function fetchScores365News(competitionId?: number): Promise<NewsItem[]> {
  const url = `${API}?${Q}${competitionId ? `&competitions=${competitionId}` : ""}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`365scores news ${r.status}`);
  const d = (await r.json()) as { news?: S365News[] };
  return (d.news ?? []).flatMap((n) => {
    if (!n.url || !n.title) return [];
    // Their links carry a tracking query; keep the canonical article only.
    const clean = n.url.split("?")[0];
    return [{
      id: encodeNewsId(clean),
      source: "scores365" as const,
      title: n.title,
      url: clean,
      image: n.image ?? null,
      publishedAt: n.publishDate ? new Date(n.publishDate).toISOString() : new Date().toISOString(),
    }];
  });
}
