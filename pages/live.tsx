import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import LiveList from "@/components/live/LiveList";
import LiveHeader from "@/components/live/LiveHeader";
import LinePitch from "@/components/live/LinePitch";
import LiveStats from "@/components/live/LiveStats";
import LiveEvents from "@/components/live/LiveEvents";
import type { LiveDetail, LiveMatch } from "@/types/live";

const POLL_MS = 15_000; // the source itself caches for 5s
type Tab = "lineup" | "stats" | "events";
type Filter = "live" | "all";

export default function LivePage() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [selected, setSelected] = useState<LiveMatch | null>(null);
  const [detail, setDetail] = useState<LiveDetail | null>(null);
  const [tab, setTab] = useState<Tab>("lineup");
  const [filter, setFilter] = useState<Filter>("live");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs so the poller never closes over stale state and never forces a
  // re-render that would move the screen under someone's finger.
  const selectedRef = useRef<LiveMatch | null>(null);
  selectedRef.current = selected;

  const loadList = useCallback(async (refresh = false) => {
    const res = await fetch(`/api/live${refresh ? "?refresh=1" : ""}`);
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
    const start = () => { if (!timer) timer = setInterval(() => refreshAll(), POLL_MS); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const onVis = () => (document.hidden ? stop() : (refreshAll(), start()));
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [refreshAll]);

  const pick = (m: LiveMatch) => { setSelected(m); setDetail(null); loadDetail(m); };

  const shown = filter === "live" ? matches.filter((m) => m.isLive) : matches;
  const liveCount = matches.filter((m) => m.isLive).length;
  const clock = updatedAt ? new Date(updatedAt).toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  return (
    <>
      <Head>
        <title>المباريات المباشرة — Chouf TV</title>
        {/* Kiosk: a stray pinch must not leave a wall screen zoomed. */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <div className="kiosk" dir="rtl">
        <aside className="kiosk-rail">
          <div className="kiosk-railhead">
            <div className="kiosk-brand"><span className="brandmark">شوف<b>TV</b></span></div>
            <div className="kiosk-seg">
              <button type="button" className={filter === "live" ? "on" : ""} onClick={() => setFilter("live")}>مباشر ({liveCount})</button>
              <button type="button" className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>اليوم ({matches.length})</button>
            </div>
          </div>
          <LiveList matches={shown} selectedId={selected?.id ?? null} onSelect={pick} />
        </aside>

        <main className="kiosk-main">
          {error && <p className="kiosk-err">{error}</p>}
          {detail ? (
            <>
              <LiveHeader d={detail} />
              <nav className="kiosk-tabs">
                <button type="button" className={tab === "lineup" ? "on" : ""} onClick={() => setTab("lineup")}>التشكيلة</button>
                <button type="button" className={tab === "stats" ? "on" : ""} onClick={() => setTab("stats")}>الإحصائيات</button>
                <button type="button" className={tab === "events" ? "on" : ""} onClick={() => setTab("events")}>الأحداث</button>
              </nav>
              <section className="kiosk-pane">
                {tab === "lineup" && <LinePitch d={detail} />}
                {tab === "stats" && <LiveStats d={detail} />}
                {tab === "events" && <LiveEvents d={detail} />}
              </section>
            </>
          ) : (
            <div className="kiosk-loading">{selected ? "جاري تحميل المباراة…" : "اختر مباراة"}</div>
          )}

          <footer className="kiosk-foot">
            <span>آخر تحديث: {clock}</span>
            <button type="button" className="kiosk-refresh" disabled={busy} onClick={() => refreshAll(true)}>
              {busy ? "جاري التحديث…" : "تحديث"}
            </button>
          </footer>
        </main>
      </div>
    </>
  );
}
