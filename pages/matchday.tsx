import Head from "next/head";
import { useCachedData } from "@/lib/useCachedData";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Nav from "@/components/Nav";
import MatchdayPoster from "@/components/MatchdayPoster";
import MatchdayDesign from "@/components/MatchdayDesign";
import MatchdayTeams from "@/components/MatchdayTeams";
import TemplateUploader from "@/components/TemplateUploader";
import ExportControls from "@/components/ExportControls";
import { DEFAULT_MATCHDAY_LAYOUT, type MatchdayLayout } from "@/config/matchdayLayout";
import type { Match } from "@/types/fixtures";
import { loadNameOverrides, saveNameOverrides, deepMerge } from "@/lib/persist";
import { getLogoOverrides, setLogoOverride, clearLogoOverride, getTemplate, setTemplate, clearTemplate } from "@/lib/db";
import { todayMA } from "@/lib/today";
import { BIG_FAME, MOROCCAN_FAME } from "@/lib/scores365Games";
import { useFitWidth } from "@/lib/useFitWidth";

const PREVIEW_W = 480;
const LKEY = "botola.matchdayLayout";
const loadLayout = (): MatchdayLayout => {
  try { const r = localStorage.getItem(LKEY); return r ? deepMerge(DEFAULT_MATCHDAY_LAYOUT, JSON.parse(r)) : DEFAULT_MATCHDAY_LAYOUT; } catch { return DEFAULT_MATCHDAY_LAYOUT; }
};
const saveLayout = (l: MatchdayLayout) => { try { localStorage.setItem(LKEY, JSON.stringify(l)); } catch { /* ignore */ } };
type Mode = "fixtures" | "results";
const MODE_KEY = "botola.matchdayMode";
const today = () => todayMA();
// Picked by default: what the poster always showed — Moroccan football first,
// then the biggest matches. Anything else is one tick away.
const DEFAULT_PICK = 10;
const picksKey = (d: string) => `botola.matchdayPicks.${d}`;

interface FixturesState { date: string; matches: Match[]; moroccanCount?: number; fetchedAt?: string; stale: boolean; errors?: string[] }


export default function Matchday() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [paneRef, previewW] = useFitWidth<HTMLElement>(PREVIEW_W);
  const [date, setDate] = useState(today());
  // The matches ticked for the poster, per day; null means the default pick.
  const [picks, setPicks] = useState<string[] | null>(null);
  useEffect(() => {
    try { const r = localStorage.getItem(picksKey(date)); setPicks(r ? JSON.parse(r) : null); } catch { setPicks(null); }
  }, [date]);
  const savePicks = (next: string[] | null) => {
    setPicks(next);
    try { if (next) localStorage.setItem(picksKey(date), JSON.stringify(next)); else localStorage.removeItem(picksKey(date)); } catch { /* private mode */ }
  };
  const [layout, setLayout] = useState<MatchdayLayout>(DEFAULT_MATCHDAY_LAYOUT);
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const [logoOverrides, setLogoOverrides] = useState<Record<string, string>>({});
  const [templateSrc, setTemplateSrc] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("fixtures");

  useEffect(() => {
    try { if (localStorage.getItem(MODE_KEY) === "results") setMode("results"); } catch { /* ignore */ }
    setLayout(loadLayout());
    setNameOverrides(loadNameOverrides());
    getLogoOverrides().then(setLogoOverrides);
    getTemplate("matchday").then(setTemplateSrc);
  }, []);

  // Last answer first, from IndexedDB, then the server behind it.
  const readFixtures = useCallback(async (): Promise<FixturesState> => {
    const res = await fetch(`/api/fixtures?date=${date}`);
    const json = await res.json();
    // Thrown, not returned: an empty answer would replace the day on screen and
    // the cached copy. A partial answer (some leagues failed) is still data.
    if (!res.ok && !json.matches?.length) throw new Error(json.error || json.errors?.join(" · ") || "فشل الطلب");
    return { date: json.date ?? date, matches: json.matches ?? [], moroccanCount: json.moroccanCount, fetchedAt: json.fetchedAt, stale: Boolean(json.stale), errors: json.errors };
  }, [date]);

  const { data, loading, busy, error: loadError, refresh: fetchFixtures } =
    useCachedData<FixturesState>(`matchday:${date}`, readFixtures);

  const pickMode = (m: Mode) => { setMode(m); try { localStorage.setItem(MODE_KEY, m); } catch { /* ignore */ } };
  const updateLayout = (n: MatchdayLayout) => { setLayout(n); saveLayout(n); };
  const onName = (id: string, v: string) => setNameOverrides((p) => { const next = { ...p, [id]: v }; saveNameOverrides(next); return next; });
  const onLogo = (id: string, d: string) => { setLogoOverrides((p) => ({ ...p, [id]: d })); setLogoOverride(id, d); };
  const onClearLogo = (id: string) => { setLogoOverrides((p) => { const n = { ...p }; delete n[id]; return n; }); clearLogoOverride(id); };
  const onTemplate = (d: string | null) => { if (d) { setTemplateSrc(d); setTemplate(d, "matchday"); } else { setTemplateSrc(null); clearTemplate("matchday"); } };

  // Only ever render data that belongs to the selected date. While a new date
  // is loading, the old matches must not sit under the new date label — that
  // would export a mislabelled poster.
  const dataForDate = data && data.date === date ? data : null;
  const candidates = useMemo(() => dataForDate?.matches ?? [], [dataForDate]);
  const chosen = useMemo(
    () => new Set(picks ?? candidates.slice(0, DEFAULT_PICK).map((m) => m.id)),
    [picks, candidates]
  );
  const picked = useMemo(() => candidates.filter((m) => chosen.has(m.id)), [candidates, chosen]);

  // The day's list carries crests as URLs (~400 games); the picked matches are
  // fetched again with them inlined. Until then a match is drawn without its
  // crests — a remote image must never reach the export canvas.
  const [inlined, setInlined] = useState<Map<string, Match>>(new Map());
  useEffect(() => { setInlined(new Map()); }, [date]);
  const missing = picked.filter((m) => !inlined.has(m.id)).map((m) => m.id);
  const missingKey = missing.slice(0, 80).join(",");
  // A failed request is tried again a few seconds later: otherwise the picked
  // matches would wait for their crests, and the export stay blocked, forever.
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!missingKey) return;
    let live = true;
    let again: ReturnType<typeof setTimeout> | undefined;
    fetch(`/api/fixtures?date=${date}&ids=${missingKey}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { matches?: Match[] }) => {
        if (!live || !j.matches) return;
        setInlined((cur) => { const next = new Map(cur); for (const m of j.matches ?? []) next.set(m.id, m); return next; });
      })
      .catch(() => { if (live) again = setTimeout(() => setRetry((n) => n + 1), 4000); });
    return () => { live = false; if (again) clearTimeout(again); };
  }, [missingKey, date, retry]);
  const bare = (m: Match): Match => ({ ...m, leagueLogo: null, home: { ...m.home, badge: null }, away: { ...m.away, badge: null } });
  // Fresh score and status from the list, crests from the inlined copy.
  const matches = picked.map((m) => {
    const i = inlined.get(m.id);
    return i ? { ...m, leagueLogo: i.leagueLogo, home: { ...m.home, badge: i.home.badge }, away: { ...m.away, badge: i.away.badge } } : bare(m);
  });

  const [query, setQuery] = useState("");
  const byCompetition = useMemo(() => {
    const q = query.trim();
    const g = new Map<string, Match[]>();
    for (const m of candidates) {
      if (q && ![m.leagueName, m.home.nameAr, m.away.nameAr, m.home.name, m.away.name].some((t) => t?.includes(q))) continue;
      g.set(m.leagueName, [...(g.get(m.leagueName) ?? []), m]);
    }
    return Array.from(g.entries());
  }, [candidates, query]);
  const pick = (ids: Set<string>) => savePicks(candidates.filter((m) => ids.has(m.id)).map((m) => m.id));
  const toggle = (list: Match[], on: boolean) => {
    const next = new Set(chosen);
    for (const m of list) { if (on) next.add(m.id); else next.delete(m.id); }
    pick(next);
  };
  const label = (side: Match["home"]) => nameOverrides[side.id] || side.nameAr || side.name;
  const loadingDate = loading || (data !== null && data.date !== date);
  // The fixtures title is off by default for a template that prints its own;
  // on the plain background nothing else names the poster, so it shows there.
  const effLayout = useMemo(() => ({
    ...layout,
    title: templateSrc ? layout.title : { ...layout.title, show: true },
    dateLabel: { ...layout.dateLabel, text: layout.dateLabel.text || date },
  }), [layout, date, templateSrc]);
  const scale = previewW / layout.width;
  const finished = matches.filter((m) => m.isFinished).length;
  const live = matches.filter((m) => m.isLive).length;
  const results = mode === "results";
  // A results poster with nothing played yet would be all dimmed kickoff times.
  const exportBlock = missing.length > 0
    ? "جاري تجهيز شعارات المباريات المختارة…"
    : results && matches.length > 0 && finished + live === 0
    ? "لم تنته أي مباراة بعد — تظهر النتائج بعد نهاية المباريات (اضغط تحديث)"
    : null;

  return (
    <>
      <Head><title>ملصق مباريات اليوم — شوف تي في</title></Head>
      <main className="app">
        <header className="topbar">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brandlogo" src="/chouftv-logo.png" alt="Chouf TV" />
          </div>
          <Nav />
        </header>
        <div className="pagehead">
          <h1>{results ? "ملصق نتائج اليوم" : "ملصق مباريات اليوم"}</h1>
          <span className="muted">الكرة المغربية أولاً — الأندية في كل المسابقات والمنتخبات الوطنية — ثم أهم المباريات · تصدير 1080×1350 PNG</span>
        </div>

        <div className="layout">
          <section className="controls">
            <div className="card">
              <h3>مباريات اليوم</h3>
              <div className="seg" role="tablist" aria-label="نوع الملصق">
                <button role="tab" aria-selected={!results} className={!results ? "seg-btn on" : "seg-btn"} onClick={() => pickMode("fixtures")}>المباريات</button>
                <button role="tab" aria-selected={results} className={results ? "seg-btn on" : "seg-btn"} onClick={() => pickMode("results")}>النتائج</button>
              </div>
              <label className="field wide"><span>التاريخ</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
              <div className="kv"><span>على الملصق</span><b>{matches.length} من {candidates.length} (المغربية: {dataForDate?.moroccanCount ?? 0})</b></div>
              {results && matches.length > 0 && (
                <div className="kv"><span>انتهت</span><b>{finished} من {matches.length}{live > 0 ? ` · ${live} مباشرة` : ""}</b></div>
              )}
              <div className="kv"><span>آخر تحديث</span><b>{dataForDate?.fetchedAt ? new Date(dataForDate.fetchedAt).toLocaleString() : "—"}</b></div>
              <div className="kv"><span>الحالة</span><span className={loadingDate ? "pill" : loadError || dataForDate?.stale ? "pill warn" : "pill ok"}>{loadingDate ? "جاري التحميل…" : loadError ? "خطأ" : dataForDate?.stale ? "نسخة مخزَّنة" : "متصل"}</span></div>
              {loadError && <p className="err">{loadError}</p>}
              {dataForDate?.errors && dataForDate.errors.length > 0 && (
                <ul className="warnlist">{dataForDate.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
              )}
              <button className="btn" disabled={loadingDate} onClick={() => fetchFixtures()}>{loadingDate ? "جاري التحديث…" : "تحديث"}</button>
            </div>
            <TemplateUploader isCustom={templateSrc !== null} onTemplate={onTemplate} defaultLabel="لا يوجد قالب بعد — تُستخدم خلفية بسيطة. ارفع قالب مباريات اليوم." resetLabel="حذف القالب" />
            {candidates.length > 0 && (
              <details className="card collapsible">
                <summary><h3>اختيار المباريات ({matches.length})</h3><span className="chev" /></summary>
                <p className="muted">كل مباريات اليوم، الكرة المغربية أولاً. اختر ما يظهر على الملصق — يتسع الملصق لأي عدد ويصغّر الصفوف تلقائياً.</p>
                <div className="row">
                  <button type="button" className="btn ghost" onClick={() => savePicks(null)}>الافتراضي ({Math.min(DEFAULT_PICK, candidates.length)})</button>
                  <button type="button" className="btn ghost" onClick={() => pick(new Set(candidates.filter((m) => m.fame > MOROCCAN_FAME).map((m) => m.id)))}>المغربية فقط</button>
                  <button type="button" className="btn ghost" onClick={() => pick(new Set(candidates.filter((m) => m.fame >= BIG_FAME).map((m) => m.id)))}>المغربية + الكبرى</button>
                  <button type="button" className="btn ghost" onClick={() => pick(new Set())}>مسح</button>
                </div>
                <label className="field wide">
                  <span>بحث عن فريق أو مسابقة</span>
                  <input type="search" dir="rtl" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="مثال: الوداد، ريال مدريد، دوري أبطال" />
                </label>
                <p className="muted">{candidates.length} مباراة في {byCompetition.length} مسابقة{query ? " (بعد البحث)" : ""}</p>
                <div className="pick-list">
                {byCompetition.map(([league, list]) => {
                  const on = list.filter((m) => chosen.has(m.id)).length;
                  return (
                    // A long day folds away: open where something is picked, or while searching.
                    <details key={league} className="pick-group" open={on > 0 || Boolean(query)}>
                      <summary>
                        <input
                          type="checkbox" checked={on === list.length} aria-label={`اختيار كل مباريات ${league}`}
                          onClick={(e) => e.stopPropagation()} onChange={(e) => toggle(list, e.target.checked)}
                        />
                        <b>{league}</b> <span className="muted">({on}/{list.length})</span>
                      </summary>
                      {list.map((m) => (
                        <label key={m.id} className="field check pick-match">
                          <input type="checkbox" checked={chosen.has(m.id)} onChange={(e) => toggle([m], e.target.checked)} />
                          <span>{m.time} · {label(m.home)} - {label(m.away)}</span>
                        </label>
                      ))}
                    </details>
                  );
                })}
                </div>
              </details>
            )}
            <ExportControls posterRef={posterRef} canExport={matches.length > 0} blocked={exportBlock} onResetDesign={() => updateLayout(DEFAULT_MATCHDAY_LAYOUT)} fileBase={results ? "choufsport-results" : "choufsport-matchday"} fileDate={date} />
            <MatchdayTeams matches={matches} nameOverrides={nameOverrides} logoOverrides={logoOverrides} onName={onName} onLogo={onLogo} onClearLogo={onClearLogo} />
            <MatchdayDesign layout={layout} onChange={updateLayout} />
          </section>

          <section className="previewpane" ref={paneRef}>
            <div className="previewsticky">
              <h3 className="muted">معاينة مباشرة</h3>
              <div className={busy ? "previewbox busy" : "previewbox"} style={{ width: previewW, height: layout.height * scale }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <MatchdayPoster ref={posterRef} mode={mode} matches={matches} layout={effLayout} templateSrc={templateSrc} nameOverrides={nameOverrides} logoOverrides={logoOverrides} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
