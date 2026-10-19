import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { NEWS_SOURCES, sourceName, type NewsItem, type NewsSourceKey } from "@/types/news";

type Filter = NewsSourceKey | "all";

const timeAgo = (iso: string): string => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(mins) || mins < 0) return "";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const h = Math.round(mins / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  return `منذ ${Math.round(h / 24)} يوم`;
};

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [failed, setFailed] = useState<NewsSourceKey[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number, append: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?page=${p}`);
      const json = await res.json();
      if (json.error) setError(json.error);
      setFailed(json.failed ?? []);
      setItems((prev) => {
        const next = append ? [...prev, ...(json.items ?? [])] : (json.items ?? []);
        // Appending a later page can repeat a story; keep the first occurrence.
        const seen = new Set<string>();
        return next.filter((i: NewsItem) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1, false); }, [load]);

  const shown = filter === "all" ? items : items.filter((i) => i.source === filter);

  return (
    <>
      <Head><title>أخبار الرياضة — Chouf TV</title></Head>
      <main className="app">
        <header className="topbar">
          <div className="brand"><span className="brandmark">شوف<b>TV</b></span> Poster Studio</div>
          <Nav />
        </header>
        <div className="pagehead">
          <h1>News</h1>
          <span className="muted" dir="rtl">آخر الأخبار من هسبورت والبطولة و365scores</span>
        </div>

        <div className="seg" role="tablist" aria-label="Source">
          <button role="tab" aria-selected={filter === "all"} className={filter === "all" ? "seg-btn on" : "seg-btn"} onClick={() => setFilter("all")}>
            الكل ({items.length})
          </button>
          {NEWS_SOURCES.map((s) => {
            const n = items.filter((i) => i.source === s.key).length;
            return (
              <button key={s.key} role="tab" aria-selected={filter === s.key} className={filter === s.key ? "seg-btn on" : "seg-btn"} onClick={() => setFilter(s.key)}>
                {s.name} ({n})
              </button>
            );
          })}
        </div>

        {failed.length > 0 && (
          <p className="err">تعذر تحميل: {failed.map(sourceName).join("، ")} — باقي المصادر معروضة.</p>
        )}
        {error && <p className="err">{error}</p>}

        <div className="newsgrid">
          {shown.map((n) => (
            <Link key={n.id} href={`/news/${n.id}`} className="newscard">
              <div className="newsthumb">
                {n.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.image} alt="" loading="lazy" />
                ) : (
                  <div className="newsthumb-empty">شوف<b>TV</b></div>
                )}

              </div>
              <div className="newsbody">
                <h3 dir="rtl">{n.title}</h3>
                <span className="muted" dir="rtl">{timeAgo(n.publishedAt)}</span>
              </div>
            </Link>
          ))}
        </div>

        {shown.length === 0 && !loading && <p className="muted">لا توجد أخبار حاليا.</p>}

        <div className="newsmore">
          <button className="btn" disabled={loading} onClick={() => { const p = page + 1; setPage(p); load(p, true); }}>
            {loading ? "جاري التحميل…" : "المزيد من الأخبار"}
          </button>
        </div>
      </main>
    </>
  );
}
