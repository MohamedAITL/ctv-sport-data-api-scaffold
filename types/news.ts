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

// Publishers are never named in the app: each is "مصدر N" by its place here.
export const NEWS_SOURCES: NewsSourceKey[] = [
  "hesport", "hespress", "elbotola", "kooora", "bein", "skynews", "goal", "elsport", "scores365",
];

export const sourceName = (k: NewsSourceKey, lang: "ar" | "en" = "ar"): string =>
  `${lang === "en" ? "Source" : "مصدر"} ${NEWS_SOURCES.indexOf(k) + 1}`;
