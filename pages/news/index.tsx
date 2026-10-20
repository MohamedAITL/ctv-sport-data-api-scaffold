import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import { NEWS_SOURCES, sourceName, type NewsItem, type NewsSourceKey } from "@/types/news";
import { useCachedData } from "@/lib/useCachedData";

type Filter = NewsSourceKey | "all";

// The server caches each publisher for five minutes, so asking more often than
// that would mostly re-read its own cache.
const AUTO_REFRESH_MS = 5 * 60 * 1000;

const timeAgo = (iso: string): string => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(mins) || mins < 0) return "";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const h = Math.round(mins / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  return `منذ ${Math.round(h / 24)} يوم`;
};

export default function NewsPage() {
  const [failed, setFailed] = useState<NewsSourceKey[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [fresh, setFresh] = useState<number | null>(null);

  const read = useCallback(async (p: number, refresh: boolean): Promise<NewsItem[]> => {
    const res = await fetch(`/api/news?page=${p}${refresh ? "&refresh=1" : ""}`);
    const json = await res.json();
    setFailed(json.failed ?? []);
    if (json.error && !json.items?.length) throw new Error(json.error);
    return (json.items ?? []) as NewsItem[];
  }, []);

  // Nothing that has been loaded is ever dropped: a refresh is a union, so the
  // feed only ever grows, newest first.
  const union = useCallback((previous: NewsItem[], incoming: NewsItem[]): NewsItem[] => {
    const known = new Set(previous.map((i) => i.id));
    const added = incoming.filter((i) => !known.has(i.id));
    setFresh(added.length);
    return [...previous, ...added].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }, []);

  const firstPage = useCallback(() => read(1, true), [read]);
  const { data, loading, busy, error, at, refresh, update } =
    useCachedData<NewsItem[]>("news:feed", firstPage, union);
  const items = useMemo(() => data ?? [], [data]);

  // "المزيد" asks the paginated publishers for the next page and folds it in.
  const loadMore = useCallback(async () => {
    const next = page + 1;
    setMore(true);
    try {
      const incoming = await read(next, false);
      setPage(next);
      update((prev) => union(prev ?? [], incoming));
    } catch { /* the button can simply be pressed again */ }
    finally { setMore(false); }
  }, [page, read, update, union]);

  // Auto-refresh: re-read every publisher on a timer so a screen left open
  // keeps filling itself. It only ever adds what is new, so nothing the reader
  // is looking at moves — and it pauses while the tab is hidden.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => { if (!document.hidden) refresh(); };
    const start = () => { if (!timer) timer = setInterval(tick, AUTO_REFRESH_MS); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const onVis = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [refresh]);

  const shown = filter === "all" ? items : items.filter((i: NewsItem) => i.source === filter);

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
            <h1>الأخبار</h1>
            <span className="muted" dir="rtl">آخر الأخبار من هسبورت وهسبريس والبطولة وكووورة وبي إن سبورتس وسكاي نيوز وgoal والرياضة و365scores</span>
          </div>
          <div className="newshead-actions">
            {fresh !== null && (
              <span className={fresh > 0 ? "pill ok" : "pill"} dir="rtl">
                {fresh > 0 ? `${fresh} خبر جديد` : "لا جديد"}
              </span>
            )}
            {at && <span className="muted">آخر تحديث: {new Date(at).toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit" })}</span>}
            <button className="btn" disabled={busy} onClick={refresh}>
              {busy && <i className="spinner" aria-hidden="true" />}
              {busy ? "جاري التحديث…" : "تحديث الأخبار"}
            </button>
          </div>
        </div>

        <div className="seg" role="tablist" aria-label="المصدر">
          <button role="tab" aria-selected={filter === "all"} className={filter === "all" ? "seg-btn on" : "seg-btn"} onClick={() => setFilter("all")}>
            الكل ({items.length})
          </button>
          {NEWS_SOURCES.map((s) => {
            const n = items.filter((i: NewsItem) => i.source === s.key).length;
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
          {/* Nine publishers are polled at once, so a first visit — with
              nothing in the local cache — would otherwise stare at an empty
              grid. Later visits paint from the cache and never see this. */}
          {loading && items.length === 0 && Array.from({ length: 8 }, (_, i) => (
            <div key={`skel-${i}`} className="newscard" aria-hidden="true">
              <div className="newsthumb skel thumb" />
              <div className="newsbody">
                <span className="skel title" />
                <span className="skel line" />
              </div>
            </div>
          ))}
          {shown.map((n: NewsItem) => (
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
          <button className="btn" disabled={more} onClick={loadMore}>
            {more && <i className="spinner" aria-hidden="true" />}
            {more ? "جاري التحميل…" : "المزيد من الأخبار"}
          </button>
        </div>
      </main>
    </>
  );
}
