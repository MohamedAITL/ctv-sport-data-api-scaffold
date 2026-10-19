// Read a publisher's own JSON-LD NewsArticle. This is structured data the site
// publishes for machines, which makes it far steadier than scraping article HTML
// — and it is only ever used for sources on the allowlist, with attribution.
import type { NewsItem } from "@/types/news";

interface LdNode {
  "@type"?: string | string[];
  articleBody?: string;
  description?: string;
  articleSection?: string | string[];
  author?: unknown;
  datePublished?: string;
  headline?: string;
}

const isArticle = (n: LdNode): boolean => {
  const t = n["@type"];
  const types = Array.isArray(t) ? t : [t];
  return types.some((x) => x === "NewsArticle" || x === "Article" || x === "ReportageNewsArticle");
};

const authorName = (a: unknown): string | null => {
  if (typeof a === "string") return a;
  if (Array.isArray(a)) return authorName(a[0]);
  if (a && typeof a === "object" && "name" in a) {
    const n = (a as { name?: unknown }).name;
    return typeof n === "string" ? n : null;
  }
  return null;
};

export async function articleFromJsonLd(url: string): Promise<Partial<NewsItem>> {
  const r = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      Accept: "text/html",
    },
  });
  if (!r.ok) throw new Error(`article ${r.status}`);
  const html = await r.text();

  const blocks = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const b of blocks) {
    const json = b.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
    let parsed: unknown;
    try { parsed = JSON.parse(json); } catch { continue; }
    const nodes: LdNode[] = [];
    const push = (v: unknown) => {
      if (Array.isArray(v)) v.forEach(push);
      else if (v && typeof v === "object") {
        const o = v as Record<string, unknown>;
        if (Array.isArray(o["@graph"])) (o["@graph"] as unknown[]).forEach(push);
        nodes.push(o as LdNode);
      }
    };
    push(parsed);
    const art = nodes.find((n) => isArticle(n) && typeof n.articleBody === "string")
      ?? nodes.find(isArticle);
    if (!art) continue;
    const section = Array.isArray(art.articleSection) ? art.articleSection[0] : art.articleSection;
    return {
      body: art.articleBody ?? null,
      bodyIsHtml: false,
      summary: art.description ?? null,
      author: authorName(art.author),
      section: section ?? null,
    };
  }
  return {};
}
