// Hespress is the biggest Moroccan news site; its sport desk publishes the same
// WordPress feed shape as hesport, full article body included.
import type { NewsItem } from "@/types/news";
import { fetchWordpressFeed } from "./rss";

const FEED = "https://www.hespress.com/sport/feed";

export async function fetchHespress(): Promise<NewsItem[]> {
  return fetchWordpressFeed(FEED, "hespress");
}
