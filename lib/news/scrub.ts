import type { NewsItem } from "@/types/news";

// The app never names its sources, but publishers name themselves in their own
// text. Only these are cut: a channel or newspaper named in a story is news.
const NAME = String.raw`(?:365\s?scores|hesport|hespress|elbotola|kooora|هسبورت|هسبريس|كووورة)`;
// With the words that lead into it, so "خاصة لموقع 365Scores" reads "خاصة".
const MENTION = new RegExp(String.raw`[ \t]*(?:ل?موقع[ \t]+|ل?صحيفة[ \t]+|ل?جريدة[ \t]+|لـ[ \t]*|ل[ \t]+)?${NAME}(?:\.com|\.ma)?`, "gi");
// The line a news feed adds to every summary, in either language.
const FEED_LINE = /\s*(?:The post|L[’']article)\s[\s\S]*?(?:appeared first on|est apparu en premier sur)\s[^\n]*$/i;
const BYLINE = new RegExp(String.raw`^\s*${NAME}\s*[-–—|:]\s*`, "i");

const tidy = (s: string) => s.replace(FEED_LINE, "").replace(MENTION, "").replace(/[ \t]+([.،:])/g, "$1").replace(/^[\s.،:\-–—]+/, "").trim();

/** Text between tags only: links and images keep their addresses. */
const inText = (html: string) => html.replace(/(^|>)([^<]*)/g, (_, tag: string, text: string) => tag + (text.trim() ? text.replace(MENTION, "") : text));

export function scrubNews(item: NewsItem): NewsItem {
  const author = item.author ? tidy(item.author.replace(BYLINE, "")) : item.author;
  return {
    ...item,
    title: tidy(item.title),
    summary: item.summary && tidy(item.summary),
    author: author || null,
    section: item.section && tidy(item.section),
    tags: item.tags?.map((t) => ({ ...t, name: tidy(t.name) })).filter((t) => t.name),
    body: item.body && (item.bodyIsHtml ? inText(item.body.replace(/<p>\s*(?:The post|L[’']article)\s(?:(?!<\/p>)[\s\S])*?(?:appeared first on|est apparu en premier sur)(?:(?!<\/p>)[\s\S])*<\/p>/gi, "")) : tidy(item.body)),
  };
}
