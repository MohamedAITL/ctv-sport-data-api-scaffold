export type NewsSourceKey =
  | "hesport" | "hespress" | "elbotola" | "kooora" | "bein" | "scores365"
  | "skynews" | "goal" | "elsport";

export interface NewsTag {
  name: string;
  kind: string; // player | team | competition | ...
  image: string | null;
  url: string | null;
}

export interface NewsItem {
  id: string; // base64url of the article URL — stateless, no server cache needed
  source: NewsSourceKey;
  title: string;
  url: string; // the original article on the publisher's site
  image: string | null;
  publishedAt: string; // ISO
  author?: string | null;
  section?: string | null;
  summary?: string | null;
  tags?: NewsTag[];
  /** Article text, only where the publisher syndicates it. HTML for hesport. */
  body?: string | null;
  bodyIsHtml?: boolean;
}

export interface NewsSourceMeta {
  key: NewsSourceKey;
  name: string; // Arabic label
  site: string;
}

export const NEWS_SOURCES: NewsSourceMeta[] = [
  { key: "hesport", name: "هسبورت", site: "https://www.hesport.com" },
  { key: "hespress", name: "هسبريس", site: "https://www.hespress.com" },
  { key: "elbotola", name: "البطولة", site: "https://www.elbotola.com" },
  { key: "kooora", name: "كووورة", site: "https://www.kooora.com" },
  { key: "bein", name: "بي إن سبورتس", site: "https://www.beinsports.com" },
  { key: "skynews", name: "سكاي نيوز عربية", site: "https://www.skynewsarabia.com" },
  { key: "goal", name: "Goal", site: "https://www.goal.com" },
  { key: "elsport", name: "الرياضة", site: "https://elsport.com" },
  { key: "scores365", name: "365scores", site: "https://www.365scores.com" },
];

export const sourceName = (k: NewsSourceKey): string =>
  NEWS_SOURCES.find((s) => s.key === k)?.name ?? k;
