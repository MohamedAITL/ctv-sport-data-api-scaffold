import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Nav from "@/components/Nav";
import MatchdayPoster from "@/components/MatchdayPoster";
import { useCachedData } from "@/lib/useCachedData";
import MatchdayDesign from "@/components/MatchdayDesign";
import MatchdayTeams from "@/components/MatchdayTeams";
import TemplateUploader from "@/components/TemplateUploader";
import ExportControls from "@/components/ExportControls";
import { DEFAULT_MATCHDAY_LAYOUT, type MatchdayLayout } from "@/config/matchdayLayout";
import { ROUND_LEAGUES, BOTOLA_LEAGUE, leagueById } from "@/config/standingsLeagues";
import { UNSCHEDULED_ROUND } from "@/lib/scores365Games";
import type { Match } from "@/types/fixtures";
import { loadNameOverrides, saveNameOverrides, deepMerge } from "@/lib/persist";
import { getLogoOverrides, setLogoOverride, clearLogoOverride, getTemplate, setTemplate, clearTemplate } from "@/lib/db";
import { useFitWidth } from "@/lib/useFitWidth";

const PREVIEW_W = 480;
const LKEY = "botola.roundLayout";
const LEAGUE_KEY = "botola.roundLeague";
const loadLayout = (): MatchdayLayout => {
  try { const r = localStorage.getItem(LKEY); return r ? deepMerge(DEFAULT_MATCHDAY_LAYOUT, JSON.parse(r)) : DEFAULT_MATCHDAY_LAYOUT; } catch { return DEFAULT_MATCHDAY_LAYOUT; }
};
const saveLayout = (l: MatchdayLayout) => { try { localStorage.setItem(LKEY, JSON.stringify(l)); } catch { /* ignore */ } };

const roundLabel = (r: number) => (r === UNSCHEDULED_ROUND ? "مباريات قادمة" : `الجولة ${r}`);

interface RoundState { competition: number; matches: Match[]; rounds: number[]; fetchedAt?: string; error?: string }


export default function RoundPage() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [paneRef, previewW] = useFitWidth<HTMLElement>(PREVIEW_W);
  const [league, setLeague] = useState<number>(BOTOLA_LEAGUE);
  const [round, setRound] = useState<number | null>(null);
  const [layout, setLayout] = useState<MatchdayLayout>(DEFAULT_MATCHDAY_LAYOUT);
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const [logoOverrides, setLogoOverrides] = useState<Record<string, string>>({});
  const [templateSrc, setTemplateSrc] = useState<string | null>(null);

  useEffect(() => {
    let initial = BOTOLA_LEAGUE;
    try { const s = localStorage.getItem(LEAGUE_KEY); if (s && ROUND_LEAGUES.includes(Number(s))) initial = Number(s); } catch { /* ignore */ }
    setLeague(initial);
    setLayout(loadLayout());
    setNameOverrides(loadNameOverrides());
    getLogoOverrides().then(setLogoOverrides);
    getTemplate("round").then(setTemplateSrc);
  }, []);

  // Last answer first, from IndexedDB, then the server behind it.
  const readRound = useCallback(async (): Promise<RoundState> => {
    const res = await fetch(`/api/round?competition=${league}`);
    const json = await res.json();
    // Thrown, not returned: an empty answer would replace the round on screen
    // and the cached copy. An unpublished schedule still arrives as a 200.
    if (!res.ok) throw new Error(json.error || "فشل الطلب");
    return { competition: league, matches: json.matches ?? [], rounds: json.rounds ?? [], fetchedAt: json.fetchedAt, error: json.error };
  }, [league]);

  const { data, loading, busy, error: loadError, refresh: fetchRound } =
    useCachedData<RoundState>(`round:${league}`, readRound);

  // Default to the newest round available for the league currently shown.
  const forLeague = data && data.competition === league ? data : null;
  // A failed refresh keeps the last data on screen and says why.
  const shownError = loadError ?? forLeague?.error ?? null;
  const rounds = useMemo(() => forLeague?.rounds ?? [], [forLeague]);
  useEffect(() => {
    if (rounds.length === 0) { setRound(null); return; }
    setRound((cur) => (cur !== null && rounds.includes(cur) ? cur : rounds[rounds.length - 1]));
  }, [rounds]);

  const matches = useMemo(
    () => (forLeague && round !== null ? forLeague.matches.filter((m) => (m.round === null ? UNSCHEDULED_ROUND : Number(m.round)) === round) : []),
    [forLeague, round]
  );

  const finished = matches.filter((m) => m.isFinished).length;
  // Results by default once the whole round is played; either way by hand —
  // a round half played can be posted as results so far.
  const [chosenMode, setChosenMode] = useState<"fixtures" | "results" | null>(null);
  useEffect(() => { setChosenMode(null); }, [league, round]);
  const results = chosenMode ? chosenMode === "results" : matches.length > 0 && finished === matches.length;

  const pickLeague = (id: number) => {
    if (id === league) return;
    try { localStorage.setItem(LEAGUE_KEY, String(id)); } catch { /* ignore */ }
    setRound(null);
    setLeague(id); // the hook swaps in that league's cached payload, then refreshes
  };
  const updateLayout = (n: MatchdayLayout) => { setLayout(n); saveLayout(n); };
  const onName = (id: string, v: string) => setNameOverrides((p) => { const next = { ...p, [id]: v }; saveNameOverrides(next); return next; });
  const onLogo = (id: string, d: string) => { setLogoOverrides((p) => ({ ...p, [id]: d })); setLogoOverride(id, d); };
  const onClearLogo = (id: string) => { setLogoOverrides((p) => { const n = { ...p }; delete n[id]; return n; }); clearLogoOverride(id); };
  const onTemplate = (d: string | null) => { if (d) { setTemplateSrc(d); setTemplate(d, "round"); } else { setTemplateSrc(null); clearTemplate("round"); } };

  // A round usually spans several days, so label it with the range it covers
  // rather than just the first match's date.
  const dateRange = useMemo(() => {
    const days = Array.from(new Set(matches.map((m) => m.date).filter(Boolean))).sort();
    if (days.length === 0) return "";
    return days.length === 1 ? days[0] : `${days[0]} ← ${days[days.length - 1]}`;
  }, [matches]);

  const effLayout = useMemo((): MatchdayLayout => {
    // roundLabel already reads "مباريات قادمة" for the unscheduled bucket, so
    // only a numbered round gets the "مباريات"/"نتائج" prefix.
    const unscheduled = round === UNSCHEDULED_ROUND;
    const fixturesText = round === null ? "" : unscheduled ? roundLabel(round) : `مباريات ${roundLabel(round)}`;
    const resultsText = round === null ? "" : unscheduled ? roundLabel(round) : `نتائج ${roundLabel(round)}`;
    return {
      ...layout,
      title: { ...layout.title, show: true, text: fixturesText },
      resultsTitle: { ...layout.resultsTitle, show: true, text: resultsText },
      dateLabel: { ...layout.dateLabel, text: dateRange },
    };
  }, [layout, round, dateRange]);

  const scale = previewW / layout.width;
  // No games for a league means 365scores hasn't published its schedule yet —
  // a normal state, so say so plainly instead of exporting an empty poster.
  const empty = !loading && forLeague !== null && rounds.length === 0;
  const exportBlock = empty
    ? "جدول هذه البطولة غير منشور بعد"
    : matches.length === 0
    ? "لا توجد مباريات في هذه الجولة بعد"
    : results && finished === 0
    ? "لم تنته أي مباراة في هذه الجولة بعد"
    : null;

  return (
    <>
      <Head><title>ملصق الجولة — شوف تي في</title></Head>
      <main className="app">
        <header className="topbar">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brandlogo" src="/chouftv-logo.png" alt="Chouf TV" />
          </div>
          <Nav />
        </header>
        <div className="pagehead">
          <h1>ملصق الجولة</h1>
          <span className="muted">{leagueById(league)?.ar} · مباريات حسب الجولة · مباشر · تصدير 1080×1350 PNG</span>
        </div>

        <div className="layout">
          <section className="controls">
            <div className="card">
              <h3>الجولة</h3>
              <div className="seg" role="tablist" aria-label="نوع الملصق">
                <button role="tab" aria-selected={!results} className={!results ? "seg-btn on" : "seg-btn"} onClick={() => setChosenMode("fixtures")}>المباريات</button>
                <button role="tab" aria-selected={results} className={results ? "seg-btn on" : "seg-btn"} onClick={() => setChosenMode("results")}>النتائج ({finished}/{matches.length})</button>
              </div>
              <label className="field wide">
                <span>البطولة</span>
                <select value={league} onChange={(e) => pickLeague(Number(e.target.value))} disabled={loading}>
                  {ROUND_LEAGUES.map((id) => (
                    <option key={id} value={id}>{leagueById(id)?.ar}</option>
                  ))}
                </select>
              </label>
              <label className="field wide">
                <span>الجولة</span>
                <select value={round ?? ""} onChange={(e) => setRound(Number(e.target.value))} disabled={loading || rounds.length === 0}>
                  {rounds.length === 0 && <option value="">—</option>}
                  {rounds.map((r) => <option key={r} value={r}>{roundLabel(r)}</option>)}
                </select>
              </label>
              <div className="kv"><span>المباريات</span><b>{matches.length}{matches.length > 0 ? ` · ${finished} انتهت` : ""}</b></div>
              <div className="kv"><span>آخر تحديث</span><b>{forLeague?.fetchedAt ? new Date(forLeague.fetchedAt).toLocaleString() : "—"}</b></div>
              <div className="kv"><span>الحالة</span><span className={loading ? "pill" : shownError ? "pill warn" : "pill ok"}>{loading ? "جاري التحميل…" : shownError ? "خطأ" : "متصل"}</span></div>
              {empty && (
                <p className="err">لم يُنشر برنامج هذه المسابقة بعد. سيظهر هنا عند الإعلان عن الجولة المقبلة.</p>
              )}
              {shownError && <p className="err">{shownError}</p>}
              <button className="btn" disabled={loading} onClick={() => fetchRound()}>{loading ? "جاري التحديث…" : "تحديث"}</button>
            </div>
            <TemplateUploader isCustom={templateSrc !== null} onTemplate={onTemplate} defaultLabel="لا يوجد قالب بعد — تُستخدم خلفية بسيطة. ارفع قالب الجولة." resetLabel="حذف القالب" />
            <ExportControls posterRef={posterRef} canExport={matches.length > 0} blocked={exportBlock} onResetDesign={() => updateLayout(DEFAULT_MATCHDAY_LAYOUT)} fileBase={`choufsport-${leagueById(league)?.id === BOTOLA_LEAGUE ? "botola1" : "botola2"}-round${round ?? ""}`} fileDate={matches[0]?.date} />
            <MatchdayTeams matches={matches} nameOverrides={nameOverrides} logoOverrides={logoOverrides} onName={onName} onLogo={onLogo} onClearLogo={onClearLogo} />
            <MatchdayDesign layout={layout} onChange={updateLayout} />
          </section>

          <section className="previewpane" ref={paneRef}>
            <div className="previewsticky">
              <h3 className="muted">معاينة مباشرة</h3>
              <div className={busy ? "previewbox busy" : "previewbox"} style={{ width: previewW, height: layout.height * scale }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <MatchdayPoster ref={posterRef} groupBy="date" mode={results ? "results" : "fixtures"} matches={matches} layout={effLayout} templateSrc={templateSrc} nameOverrides={nameOverrides} logoOverrides={logoOverrides} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
