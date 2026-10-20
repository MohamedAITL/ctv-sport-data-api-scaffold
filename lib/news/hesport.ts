// hesport.com publishes a standard WordPress RSS feed that carries the full
// article in <content:encoded>, so a detail page needs no second request.
import type { NewsItem } from "@/types/news";
import { fetchWordpressFeed } from "./rss";

const FEED = "https://www.hesport.com/feed";

export async function fetchHesport(): Promise<NewsItem[]> {
  return fetchWordpressFeed(FEED, "hesport");
}
