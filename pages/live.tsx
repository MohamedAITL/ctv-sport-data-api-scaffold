import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import LiveList from "@/components/live/LiveList";
import PrefsToggle from "@/components/PrefsToggle";
import LiveHeader from "@/components/live/LiveHeader";
import LinePitch from "@/components/live/LinePitch";
import LiveStats from "@/components/live/LiveStats";
import LiveEvents from "@/components/live/LiveEvents";
import LivePrevious from "@/components/live/LivePrevious";
import type { LiveDetail, LiveMatch } from "@/types/live";
import { todayMA } from "@/lib/today";
import { useLang, type T } from "@/lib/prefs";

const POLL_MS = 15_000; // the source itself caches for 5s
type Tab = "lineup" | "stats" | "events" | "previous";
type Filter = "live" | "done" | "all";

const isoToday = () => todayMA();
const shiftDay = (iso: string, days: number) => {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const arDay = (iso: string, t: T, locale: string) =>
  iso === isoToday() ? t("اليوم", "Today") : new Date(iso + "T12:00:00Z").toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

export default function LivePage() {
  const { t, locale } = useLang();
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [selected, setSelected] = useState<LiveMatch | null>(null);
  const [detail, setDetail] = useState<LiveDetail | null>(null);
  const [tab, setTab] = useState<Tab>("lineup");
  const [filter, setFilter] = useState<Filter>("live");
  const [date, setDate] = useState<string>(isoToday());
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs so the poller never closes over stale state and never forces a
  // re-render that would move the screen under someone's finger.
  const selectedRef = useRef<LiveMatch | null>(null);
  selectedRef.current = selected;
  const dateRef = useRef<string>(date);
  dateRef.current = date;
  const railRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async (refresh = false) => {
    const day = dateRef.current;
    const qs = new URLSearchParams();
    if (day !== isoToday()) qs.set("date", day);
    if (refresh) qs.set("refresh", "1");
    const res = await fetch(`/api/live${qs.toString() ? `?${qs}` : ""}`);
    const json = await res.json();
    if (json.error && !json.matches?.length) throw new Error(json.error);
    const list: LiveMatch[] = json.matches ?? [];
    setMatches(list);
    setUpdatedAt(json.fetchedAt ?? new Date().toISOString());
    // Keep the chosen match selected across refreshes; adopt the first live
    // match only when nothing is selected yet.
    const cur = selectedRef.current;
    const next = cur ? list.find((m) => m.id === cur.id) ?? cur : list.find((m) => m.isLive) ?? list[0] ?? null;
    if (next) setSelected(next);
    // An empty "مباشر" rail looks broken when nothing is live: show the results,
    // or every game if none has finished yet. Only from "مباشر" — another day
    // opens on "الكل", and overriding it hid tomorrow behind its 3 results.
    if (!cur && list.length > 0 && !list.some((m) => m.isLive)) {
      setFilter((f) => (f !== "live" ? f : list.some((m) => m.isFinished) ? "done" : "all"));
    }
    return list;
  }, []);

  const loadDetail = useCallback(async (m: LiveMatch) => {
    const res = await fetch(`/api/live/${m.id}?matchup=${encodeURIComponent(m.matchupId)}`);
    const json = await res.json();
    if (json.detail) setDetail(json.detail);
  }, []);

  const refreshAll = useCallback(async (manual = false) => {
    if (manual) setBusy(true);
    setError(null);
    try {
      await loadList(manual);
      const cur = selectedRef.current;
      if (cur) await loadDetail(cur);
    } catch (e) {
      setError(String(e));
    } finally {
      if (manual) setBusy(false);
    }
  }, [loadList, loadDetail]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // Poll, but never while the screen is not being shown.
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    // A finished day never changes, so only today is polled.
    const start = () => { if (!timer && dateRef.current === isoToday()) timer = setInterval(() => refreshAll(), POLL_MS); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const onVis = () => (document.hidden ? stop() : (refreshAll(), start()));
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [refreshAll, date]);

  const pick = (m: LiveMatch) => { setSelected(m); setDetail(null); loadDetail(m); };

  // Live matches head both filters, so without this the rail looks unchanged
  // when you switch — which read as "the button does nothing".
  const toTop = () => { if (railRef.current) railRef.current.scrollTop = 0; };
  const pickFilter = (f: Filter) => { setFilter(f); toTop(); };
  const goDay = (iso: string) => {
    setDate(iso);
    dateRef.current = iso;
    setSelected(null); selectedRef.current = null;
    setDetail(null); setMatches([]);
    // Past days are results; future days are fixtures; today leads with live.
    setFilter(iso === isoToday() ? "live" : iso < isoToday() ? "done" : "all");
    toTop();
    refreshAll(true);
  };

  const shown =
    filter === "live" ? matches.filter((m) => m.isLive)
    : filter === "done" ? matches.filter((m) => m.isFinished)
    : matches;
  const liveCount = matches.filter((m) => m.isLive).length;
  const doneCount = matches.filter((m) => m.isFinished).length;
  const clock = updatedAt ? new Date(updatedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  return (
    <>
      <Head>
        <title>{t("المباريات المباشرة — Chouf TV")}</title>
        {/* Kiosk: a stray pinch must not leave a wall screen zoomed. */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <div className="kiosk">
        <aside className="kiosk-rail">
          <div className="kiosk-railhead">
            <div className="kiosk-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="brandlogo kiosk-logo" src="/chouftv-logo.png" alt="Chouf TV" />
              <Link href="/" className="kiosk-back">{t("رجوع للتطبيق")}</Link>
              <PrefsToggle />
            </div>
            <div className="kiosk-day">
              <button type="button" aria-label={t("اليوم السابق")} onClick={() => goDay(shiftDay(date, -1))}>‹</button>
              <button type="button" className="kiosk-daylabel" onClick={() => goDay(isoToday())}>{arDay(date, t, locale)}</button>
              <button type="button" aria-label={t("اليوم التالي")} onClick={() => goDay(shiftDay(date, 1))}>›</button>
            </div>
            <div className="kiosk-seg three">
              <button type="button" className={filter === "live" ? "on" : ""} onClick={() => pickFilter("live")}>{t("مباشر (")}{liveCount})</button>
              <button type="button" className={filter === "done" ? "on" : ""} onClick={() => pickFilter("done")}>{t("النتائج (")}{doneCount})</button>
              <button type="button" className={filter === "all" ? "on" : ""} onClick={() => pickFilter("all")}>{t("الكل (")}{matches.length})</button>
            </div>
          </div>
          <div className="kl-scroll" ref={railRef}>
            <LiveList matches={shown} selectedId={selected?.id ?? null} onSelect={pick} />
          </div>
        </aside>

        <main className="kiosk-main">
          {error && <p className="kiosk-err">{error}</p>}
          {detail ? (
            <>
              <LiveHeader d={detail} />
              <nav className="kiosk-tabs">
                <button type="button" className={tab === "lineup" ? "on" : ""} onClick={() => setTab("lineup")}>{t("التشكيلة")}</button>
                <button type="button" className={tab === "stats" ? "on" : ""} onClick={() => setTab("stats")}>{t("الإحصائيات")}</button>
                <button type="button" className={tab === "events" ? "on" : ""} onClick={() => setTab("events")}>{t("الأحداث")}</button>
                <button type="button" className={tab === "previous" ? "on" : ""} onClick={() => setTab("previous")}>{t("مواجهات سابقة")}</button>
              </nav>
              <section className="kiosk-pane">
                {tab === "lineup" && <LinePitch d={detail} />}
                {tab === "stats" && <LiveStats d={detail} />}
                {tab === "events" && <LiveEvents d={detail} />}
                {tab === "previous" && <LivePrevious d={detail} />}
              </section>
            </>
          ) : (
            <div className="kiosk-loading">{selected ? t("جاري تحميل المباراة…", "Loading the match…") : t("اختر مباراة", "Pick a match")}</div>
          )}

          <footer className="kiosk-foot">
            <span>{t("آخر تحديث: ")}{clock}</span>
            <button type="button" className="kiosk-refresh" disabled={busy} onClick={() => refreshAll(true)}>
              {busy ? t("جاري التحديث…", "Refreshing…") : t("تحديث", "Refresh")}
            </button>
          </footer>
        </main>
      </div>
    </>
  );
}
