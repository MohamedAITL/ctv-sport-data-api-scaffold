import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Nav from "@/components/Nav";
import MatchdayPoster from "@/components/MatchdayPoster";
import MatchdayDesign from "@/components/MatchdayDesign";
import MatchdayTeams from "@/components/MatchdayTeams";
import TemplateUploader from "@/components/TemplateUploader";
import ExportControls from "@/components/ExportControls";
import { DEFAULT_MATCHDAY_LAYOUT, type MatchdayLayout } from "@/config/matchdayLayout";
import type { Match } from "@/types/fixtures";
import { loadNameOverrides, saveNameOverrides } from "@/lib/persist";
import { getLogoOverrides, setLogoOverride, clearLogoOverride, getTemplate, setTemplate, clearTemplate } from "@/lib/db";

const PREVIEW_W = 480;
const LKEY = "botola.matchdayLayout";
const loadLayout = (): MatchdayLayout => {
  try { const r = localStorage.getItem(LKEY); return r ? { ...DEFAULT_MATCHDAY_LAYOUT, ...JSON.parse(r) } : DEFAULT_MATCHDAY_LAYOUT; } catch { return DEFAULT_MATCHDAY_LAYOUT; }
};
const saveLayout = (l: MatchdayLayout) => { try { localStorage.setItem(LKEY, JSON.stringify(l)); } catch { /* ignore */ } };
const today = () => new Date().toISOString().slice(0, 10);

interface FixturesState { date: string; matches: Match[]; fetchedAt?: string; stale: boolean; errors?: string[] }

export default function Matchday() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [date, setDate] = useState(today());
  const [layout, setLayout] = useState<MatchdayLayout>(DEFAULT_MATCHDAY_LAYOUT);
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const [logoOverrides, setLogoOverrides] = useState<Record<string, string>>({});
  const [templateSrc, setTemplateSrc] = useState<string | null>(null);
  const [data, setData] = useState<FixturesState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLayout(loadLayout());
    setNameOverrides(loadNameOverrides());
    getLogoOverrides().then(setLogoOverrides);
    getTemplate("matchday").then(setTemplateSrc);
  }, []);

  const fetchFixtures = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fixtures?date=${d}`);
      const json = await res.json();
      setData({ date: json.date ?? d, matches: json.matches ?? [], fetchedAt: json.fetchedAt, stale: Boolean(json.stale), errors: json.errors });
    } catch (e) {
      setData({ date: d, matches: [], stale: true, errors: [String(e)] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFixtures(date); }, [date, fetchFixtures]);

  const updateLayout = (n: MatchdayLayout) => { setLayout(n); saveLayout(n); };
  const onName = (id: string, v: string) => setNameOverrides((p) => { const next = { ...p, [id]: v }; saveNameOverrides(next); return next; });
  const onLogo = (id: string, d: string) => { setLogoOverrides((p) => ({ ...p, [id]: d })); setLogoOverride(id, d); };
  const onClearLogo = (id: string) => { setLogoOverrides((p) => { const n = { ...p }; delete n[id]; return n; }); clearLogoOverride(id); };
  const onTemplate = (d: string | null) => { if (d) { setTemplateSrc(d); setTemplate(d, "matchday"); } else { setTemplateSrc(null); clearTemplate("matchday"); } };

  const matches = data?.matches ?? [];
  const effLayout = useMemo(() => ({ ...layout, dateLabel: { ...layout.dateLabel, text: layout.dateLabel.text || date } }), [layout, date]);
  const scale = PREVIEW_W / layout.width;
  const botolaCount = matches.filter((m) => m.leagueName === "Botola Pro").length;

  return (
    <>
      <Head><title>Matchday Poster — Chouf TV</title></Head>
      <main className="app">
        <header className="apphead">
          <h1>Matchday Poster</h1>
          <Nav />
          <span className="muted">Chouf TV · live GOAL API · 1080×1350</span>
        </header>

        <div className="layout">
          <section className="controls">
            <div className="card">
              <h3>Matchday</h3>
              <label className="field wide"><span>Date</span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
              <div className="kv"><span>Matches</span><b>{matches.length} / 10 (Botola: {botolaCount})</b></div>
              <div className="kv"><span>Last refresh</span><b>{data?.fetchedAt ? new Date(data.fetchedAt).toLocaleString() : "—"}</b></div>
              <div className="kv"><span>Status</span><span className={data?.stale ? "pill warn" : loading ? "pill" : "pill ok"}>{loading ? "Loading…" : data?.stale ? "Cached (stale)" : "Connected"}</span></div>
              {data?.errors && data.errors.length > 0 && (
                <ul className="warnlist">{data.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
              )}
              <button className="btn" disabled={loading} onClick={() => fetchFixtures(date)}>{loading ? "Refreshing…" : "Refresh"}</button>
            </div>
            <TemplateUploader isCustom={templateSrc !== null} onTemplate={onTemplate} />
            <ExportControls posterRef={posterRef} canExport={matches.length > 0} onResetDesign={() => updateLayout(DEFAULT_MATCHDAY_LAYOUT)} fileBase="choufsport-matchday" />
            <MatchdayTeams matches={matches} nameOverrides={nameOverrides} logoOverrides={logoOverrides} onName={onName} onLogo={onLogo} onClearLogo={onClearLogo} />
            <MatchdayDesign layout={layout} onChange={updateLayout} />
          </section>

          <section className="previewpane">
            <div className="previewsticky">
              <h3 className="muted">Live preview</h3>
              <div className="previewbox" style={{ width: PREVIEW_W, height: layout.height * scale }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <MatchdayPoster ref={posterRef} matches={matches} layout={effLayout} templateSrc={templateSrc} nameOverrides={nameOverrides} logoOverrides={logoOverrides} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
