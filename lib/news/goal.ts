// goal.com Arabic. No feed (their /feeds/ paths are gone), but the news archive
// page ships 30 cards in __NEXT_DATA__ under content.newsArchive.news.cards.
import type { NewsItem } from "@/types/news";
import { encodeNewsId } from "./id";
import { nextData, pageProps } from "./nextdata";
import { isoOrNow } from "./date";

const SITE = "https://www.goal.com";
const NEWS = `${SITE}/ar/%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1`; // /ar/أخبار

// `image` is not a URL: it nests one ({ image: { src, width, height } }), and
// assigning it straight through renders "[object Object]" as the src.
interface GoalImage { src?: string; image?: { src?: string } }
interface GoalCard {
  title?: string;
  teaser?: string;
  url?: string;
  image?: GoalImage;
  publishTime?: string;
}

const imageOf = (i?: GoalImage): string | null => i?.image?.src ?? i?.src ?? null;

const dig = (o: unknown, path: string[]): unknown =>
  path.reduce<unknown>((cur, k) => (cur && typeof cur === "object" ? (cur as Record<string, unknown>)[k] : undefined), o);

export async function fetchGoal(): Promise<NewsItem[]> {
  const cards = dig(pageProps(await nextData(NEWS, "goal.com")), ["content", "newsArchive", "news", "cards"]);
  if (!Array.isArray(cards)) return [];
  return (cards as GoalCard[]).flatMap((c) => {
    if (!c.title || !c.url) return [];
    const url = c.url.startsWith("http") ? c.url : `${SITE}${c.url}`;
    return [{
      id: encodeNewsId(url),
      source: "goal" as const,
      title: c.title,
      url,
      image: imageOf(c.image),
      publishedAt: isoOrNow(c.publishTime),
      summary: c.teaser ?? null,
    }];
  });
}
