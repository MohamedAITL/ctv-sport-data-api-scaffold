// Sky News Arabia's sport desk. A plain RSS feed of 100 items with images, but
// no <content:encoded> — the article body comes from the page's JSON-LD, the
// same path the other body-less sources use.
import type { NewsItem } from "@/types/news";
import { fetchWordpressFeed } from "./rss";

const FEED = "https://www.skynewsarabia.com/rss/sport.xml";

export async function fetchSkyNews(): Promise<NewsItem[]> {
  return fetchWordpressFeed(FEED, "skynews");
}
