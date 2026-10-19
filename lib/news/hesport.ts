// hesport.com publishes a standard WordPress RSS feed that carries the full
// article in <content:encoded>, so a detail page needs no second request.
import type { NewsItem } from "@/types/news";
import { encodeNewsId } from "./id";

const FEED = "https://www.hesport.com/feed";

const unwrap = (s: string): string =>
  s.replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "").trim();

const tag = (block: string, name: string): string | null => {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? unwrap(m[1]) : null;
};

const decodeEntities = (s: string): string =>
  s
    .replace(/&quot;/g, '"').replace(/&#8217;/g, "’").replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”").replace(/&#038;/g, "&").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");

// WordPress appends a syndication footer to the RSS body ("L'article X est
// apparu en premier sur Y" / "The post X appeared first on Y"). It is feed
// plumbing, not article text, so drop that trailing paragraph.
const stripFeedFooter = (html: string): string =>
  html
    .replace(/<p>(?:(?!<\/p>)[\s\S])*?(?:est apparu en premier sur|appeared first on)[\s\S]*?<\/p>\s*$/i, "")
    .trim();

const firstImage = (block: string): string | null => {
  const m = block.match(/https?:\/\/[^"'\s<]+?\.(?:jpg|jpeg|png|webp)/i);
  return m ? m[0] : null;
};

export async function fetchHesport(): Promise<NewsItem[]> {
  const r = await fetch(FEED, { headers: { Accept: "application/rss+xml,application/xml" } });
  if (!r.ok) throw new Error(`hesport feed ${r.status}`);
  const xml = await r.text();

  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items.flatMap((block) => {
    const url = tag(block, "link");
    const title = tag(block, "title");
    if (!url || !title) return [];
    const pub = tag(block, "pubDate");
    const body = tag(block, "content:encoded");
    return [{
      id: encodeNewsId(url),
      source: "hesport" as const,
      title: decodeEntities(title),
      url,
      image: firstImage(block),
      publishedAt: pub ? new Date(pub).toISOString() : new Date().toISOString(),
      author: tag(block, "dc:creator"),
      section: tag(block, "category"),
      summary: tag(block, "description") ? decodeEntities(tag(block, "description")!).replace(/<[^>]+>/g, "").trim() : null,
      body: body ? stripFeedFooter(body) : null,
      bodyIsHtml: Boolean(body),
    }];
  });
}
