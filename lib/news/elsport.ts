// elsport.com (Elnashra Sport). No feed, no API and no __NEXT_DATA__: the news
// cards are plain anchors that carry the full headline in `title` and the image
// next to them.
import type { NewsItem } from "@/types/news";
import { encodeNewsId } from "./id";
import { BROWSER_UA } from "./nextdata";
import { decodeEntities } from "./rss";

const SITE = "https://elsport.com";

// The homepage mixes half a dozen card layouts (newsElement, newsimg,
// news-title, pictureBoxTitle…), so the anchor itself is the anchor: every
// /news/show/ link, then its title attribute, its own text, or failing both the
// slug — and the first image that follows it.
const LINK = /<a\b([^>]*)href="(https:\/\/elsport\.com\/news\/show\/\d+\/[^"]*)"([^>]*)>([\s\S]{0,400})/g;
const TITLE_ATTR = /title="([^"]{4,})"/;
const IMG = /<img[^>]*src="([^"]+)"/;

// "…/844372/شاهد-هدف-الهلال-مرمى-الحزم" -> "شاهد هدف الهلال مرمى الحزم"
const fromSlug = (url: string): string =>
  decodeURIComponent(url.split("/").pop() ?? "").replace(/-/g, " ").trim();

// The card has no date, but the image file is named <id>_<epoch seconds>.jpg —
// checked against the site: an "موجز المساء" card carried 1792431849, which is
// that evening. Falls back to now rather than to 1970.
const stamp = (image: string): string => {
  const m = image.match(/_(\d{10})\./);
  const t = m ? Number(m[1]) * 1000 : NaN;
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString();
};

export async function fetchElsport(): Promise<NewsItem[]> {
  const r = await fetch(SITE, { headers: { "User-Agent": BROWSER_UA, Accept: "text/html" } });
  if (!r.ok) throw new Error(`elsport ${r.status}`);
  const html = await r.text();

  // The same story appears in several modules; the image-bearing card is the
  // one worth keeping, because its file name is the only timestamp on the page
  // — a text-only link would have to claim "now" and would then sit at the top
  // of a feed sorted by date.
  const byUrl = new Map<string, NewsItem>();
  LINK.lastIndex = 0;
  for (let m = LINK.exec(html); m !== null; m = LINK.exec(html)) {
    const [, before, url, after, tail] = m;
    const attrs = `${before} ${after}`;
    const img = IMG.exec(tail)?.[1] ?? null;
    if (!img || byUrl.has(url)) continue;
    const inner = tail.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
    const title = TITLE_ATTR.exec(attrs)?.[1] || inner || fromSlug(url);
    if (!title) continue;
    byUrl.set(url, {
      id: encodeNewsId(url),
      source: "elsport",
      title: decodeEntities(title).trim(),
      url,
      image: img.startsWith("http") ? img : `${SITE}${img}`,
      publishedAt: stamp(img),
    });
  }
  return Array.from(byUrl.values());
}
