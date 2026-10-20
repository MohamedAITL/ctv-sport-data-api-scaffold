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
  const [refreshing, setRefreshing] = useState(false);
  const [fresh, setFresh] = useState<number | null>(null);

  const load = useCallback(async (p: number, append: boolean, refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?page=${p}${refresh ? "&refresh=1" : ""}`);
      const json = await res.json();
      if (json.error) setError(json.error);
      setFailed(json.failed ?? []);
      setItems((prev) => {
        const incoming: NewsItem[] = json.items ?? [];
        // A refresh keeps what is already loaded and puts anything newly
        // published on top, so the list grows instead of resetting.
        if (refresh) {
          const known = new Set(prev.map((i) => i.id));
          const added = incoming.filter((i) => !known.has(i.id));
          setFresh(added.length);
          return [...added, ...prev].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
        }
        const next = append ? [...prev, ...incoming] : incoming;
        // Appending a later page can repeat a story; keep the first occurrence.
        const seen = new Set<string>();
        return next.filter((i: NewsItem) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(1, false); }, [load]);

  const shown = filter === "all" ? items : items.filter((i) => i.source === filter);

  return (
    <>
      <Head><title>أخبار الرياضة — Chouf TV</title></Head>
      <main className="app">
        <header className="topbar">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brandlogo" src="/chouftv-logo.png" alt="Chouf TV" />
          </div>
          <Nav />
        </header>
        <div className="pagehead newshead">
          <div>
            <h1>News</h1>
            <span className="muted" dir="rtl">آخر الأخبار من هسبورت والبطولة وكووورة و365scores</span>
          </div>
          <div className="newshead-actions">
            {fresh !== null && (
              <span className={fresh > 0 ? "pill ok" : "pill"} dir="rtl">
                {fresh > 0 ? `${fresh} خبر جديد` : "لا جديد"}
              </span>
            )}
            <button className="btn" disabled={refreshing} onClick={() => { setPage(1); load(1, false, true); }}>
              {refreshing ? "جاري التحديث…" : "تحديث الأخبار"}
            </button>
          </div>
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
          {/* Four publishers are polled at once, so the first load is slow
              enough that an empty grid reads as broken. */}
          {loading && items.length === 0 && Array.from({ length: 8 }, (_, i) => (
            <div key={`skel-${i}`} className="newscard" aria-hidden="true">
              <div className="newsthumb skel thumb" />
              <div className="newsbody">
                <span className="skel title" />
                <span className="skel line" />
              </div>
            </div>
          ))}
          {shown.map((n) => (
            <Link key={n.id} href={`/news/${n.id}`} className="newscard">
              <div className="newsthumb">
                {n.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.image} alt="" loading="lazy" />
                ) : (
                  <div className="newsthumb-empty">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/chouftv-logo.png" alt="" />
                  </div>
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
