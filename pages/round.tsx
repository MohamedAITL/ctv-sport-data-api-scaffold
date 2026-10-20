import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Nav from "@/components/Nav";
import MatchdayPoster from "@/components/MatchdayPoster";
import { useLatestRequest } from "@/lib/useLatestRequest";
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

const PREVIEW_W = 480;
const LKEY = "botola.roundLayout";
const LEAGUE_KEY = "botola.roundLeague";
const loadLayout = (): MatchdayLayout => {
  try { const r = localStorage.getItem(LKEY); return r ? deepMerge(DEFAULT_MATCHDAY_LAYOUT, JSON.parse(r)) : DEFAULT_MATCHDAY_LAYOUT; } catch { return DEFAULT_MATCHDAY_LAYOUT; }
};
const saveLayout = (l: MatchdayLayout) => { try { localStorage.setItem(LKEY, JSON.stringify(l)); } catch { /* ignore */ } };

const roundLabel = (r: number) => (r === UNSCHEDULED_ROUND ? "مباريات قادمة" : `الجولة ${r}`);

interface RoundState { competition: number; matches: Match[]; rounds: number[]; fetchedAt?: string; error?: string }

// Cached per league so switching league/round costs no extra API call.
const cache: Record<number, RoundState> = {};

export default function RoundPage() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [league, setLeague] = useState<number>(BOTOLA_LEAGUE);
  const [round, setRound] = useState<number | null>(null);
  const [layout, setLayout] = useState<MatchdayLayout>(DEFAULT_MATCHDAY_LAYOUT);
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const [logoOverrides, setLogoOverrides] = useState<Record<string, string>>({});
  const [templateSrc, setTemplateSrc] = useState<string | null>(null);
  const [data, setData] = useState<RoundState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let initial = BOTOLA_LEAGUE;
    try { const s = localStorage.getItem(LEAGUE_KEY); if (s && ROUND_LEAGUES.includes(Number(s))) initial = Number(s); } catch { /* ignore */ }
    setLeague(initial);
    setLayout(loadLayout());
    setNameOverrides(loadNameOverrides());
    getLogoOverrides().then(setLogoOverrides);
    getTemplate("round").then(setTemplateSrc);
  }, []);

  const req = useLatestRequest<number>(BOTOLA_LEAGUE);
  const fetchRound = useCallback(async (lg: number) => {
    req.claim(lg);
    setLoading(true);
    try {
      const res = await fetch(`/api/round?competition=${lg}`);
      const json = await res.json();
      const s: RoundState = { competition: lg, matches: json.matches ?? [], rounds: json.rounds ?? [], fetchedAt: json.fetchedAt, error: json.error };
      cache[lg] = s;
      if (req.isCurrent(lg)) setData(s);
    } catch (e) {
      if (req.isCurrent(lg)) setData({ competition: lg, matches: [], rounds: [], error: String(e) });
    } finally {
      if (req.isCurrent(lg)) setLoading(false);
    }
  }, [req]);

  useEffect(() => {
    if (cache[league]) setData(cache[league]);
    else fetchRound(league);
  }, [league, fetchRound]);

  // Default to the newest round available for the league currently shown.
  const forLeague = data && data.competition === league ? data : null;
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
  const results = matches.length > 0 && finished === matches.length;

  const pickLeague = (id: number) => {
    if (id === league) return;
    try { localStorage.setItem(LEAGUE_KEY, String(id)); } catch { /* ignore */ }
    setRound(null);
    setData(cache[id] ?? null);
    setLeague(id);
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

  const scale = PREVIEW_W / layout.width;
  // No games for a league means 365scores hasn't published its schedule yet —
  // a normal state, so say so plainly instead of exporting an empty poster.
  const empty = !loading && forLeague !== null && rounds.length === 0;
  const exportBlock = empty
    ? "جدول هذه البطولة غير منشور بعد — no schedule published for this league yet"
    : matches.length === 0
    ? "no matches in this round yet"
    : null;

  return (
    <>
      <Head><title>Round Poster — Chouf TV</title></Head>
      <main className="app">
        <header className="topbar">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brandlogo" src="/chouftv-logo.png" alt="Chouf TV" />
          </div>
          <Nav />
        </header>
        <div className="pagehead">
          <h1>Round Poster</h1>
          <span className="muted">{leagueById(league)?.name} · matches by round · live 365scores · exports 1080×1350 PNG</span>
        </div>

        <div className="layout">
          <section className="controls">
            <div className="card">
              <h3>Round</h3>
              <label className="field wide">
                <span>League</span>
                <select value={league} onChange={(e) => pickLeague(Number(e.target.value))} disabled={loading}>
                  {ROUND_LEAGUES.map((id) => (
                    <option key={id} value={id}>{leagueById(id)?.name} · {leagueById(id)?.ar}</option>
                  ))}
                </select>
              </label>
              <label className="field wide">
                <span>Round</span>
                <select value={round ?? ""} onChange={(e) => setRound(Number(e.target.value))} disabled={loading || rounds.length === 0}>
                  {rounds.length === 0 && <option value="">—</option>}
                  {rounds.map((r) => <option key={r} value={r}>{roundLabel(r)}</option>)}
                </select>
              </label>
              <div className="kv"><span>Matches</span><b>{matches.length}{matches.length > 0 ? ` · ${finished} finished` : ""}</b></div>
              <div className="kv"><span>Last refresh</span><b>{forLeague?.fetchedAt ? new Date(forLeague.fetchedAt).toLocaleString() : "—"}</b></div>
              <div className="kv"><span>Status</span><span className={loading ? "pill" : forLeague?.error ? "pill warn" : "pill ok"}>{loading ? "Loading…" : forLeague?.error ? "Error" : "Connected"}</span></div>
              {empty && (
                <p className="err">365scores has not published a schedule for this league yet. It will appear here once the next round is announced.</p>
              )}
              {forLeague?.error && <p className="err">{forLeague.error}</p>}
              <button className="btn" disabled={loading} onClick={() => fetchRound(league)}>{loading ? "Refreshing…" : "Refresh"}</button>
            </div>
            <TemplateUploader isCustom={templateSrc !== null} onTemplate={onTemplate} defaultLabel="No template yet — using a plain background. Upload your round template." resetLabel="Remove template" />
            <ExportControls posterRef={posterRef} canExport={matches.length > 0} blocked={exportBlock} onResetDesign={() => updateLayout(DEFAULT_MATCHDAY_LAYOUT)} fileBase={`choufsport-${leagueById(league)?.id === BOTOLA_LEAGUE ? "botola1" : "botola2"}-round${round ?? ""}`} fileDate={matches[0]?.date} />
            <MatchdayTeams matches={matches} nameOverrides={nameOverrides} logoOverrides={logoOverrides} onName={onName} onLogo={onLogo} onClearLogo={onClearLogo} />
            <MatchdayDesign layout={layout} onChange={updateLayout} />
          </section>

          <section className="previewpane">
            <div className="previewsticky">
              <h3 className="muted">Live preview</h3>
              <div className="previewbox" style={{ width: PREVIEW_W, height: layout.height * scale }}>
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
