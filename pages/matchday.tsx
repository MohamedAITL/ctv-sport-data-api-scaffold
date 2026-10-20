import Head from "next/head";
import { useLatestRequest } from "@/lib/useLatestRequest";
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

const PREVIEW_W = 480;
const LKEY = "botola.matchdayLayout";
const loadLayout = (): MatchdayLayout => {
  try { const r = localStorage.getItem(LKEY); return r ? deepMerge(DEFAULT_MATCHDAY_LAYOUT, JSON.parse(r)) : DEFAULT_MATCHDAY_LAYOUT; } catch { return DEFAULT_MATCHDAY_LAYOUT; }
};
const saveLayout = (l: MatchdayLayout) => { try { localStorage.setItem(LKEY, JSON.stringify(l)); } catch { /* ignore */ } };
type Mode = "fixtures" | "results";
const MODE_KEY = "botola.matchdayMode";
const today = () => new Date().toISOString().slice(0, 10);

interface FixturesState { date: string; matches: Match[]; fetchedAt?: string; stale: boolean; errors?: string[] }

// Cached per date across navigation so switching pages / dates does not refetch.
const fixturesCache: Record<string, FixturesState> = {};

export default function Matchday() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [date, setDate] = useState(today());
  const [layout, setLayout] = useState<MatchdayLayout>(DEFAULT_MATCHDAY_LAYOUT);
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const [logoOverrides, setLogoOverrides] = useState<Record<string, string>>({});
  const [templateSrc, setTemplateSrc] = useState<string | null>(null);
  const [data, setData] = useState<FixturesState | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("fixtures");

  useEffect(() => {
    try { if (localStorage.getItem(MODE_KEY) === "results") setMode("results"); } catch { /* ignore */ }
    setLayout(loadLayout());
    setNameOverrides(loadNameOverrides());
    getLogoOverrides().then(setLogoOverrides);
    getTemplate("matchday").then(setTemplateSrc);
  }, []);

  const req = useLatestRequest<string>("");
  const fetchFixtures = useCallback(async (d: string) => {
    req.claim(d);
    setLoading(true);
    try {
      const res = await fetch(`/api/fixtures?date=${d}`);
      const json = await res.json();
      const s: FixturesState = { date: json.date ?? d, matches: json.matches ?? [], fetchedAt: json.fetchedAt, stale: Boolean(json.stale), errors: json.errors };
      fixturesCache[d] = s;
      if (req.isCurrent(d)) setData(s);
    } catch (e) {
      if (req.isCurrent(d)) setData({ date: d, matches: [], stale: true, errors: [String(e)] });
    } finally {
      if (req.isCurrent(d)) setLoading(false);
    }
  }, [req]);

  useEffect(() => {
    if (fixturesCache[date]) setData(fixturesCache[date]);
    else fetchFixtures(date);
  }, [date, fetchFixtures]);

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
  const matches = dataForDate?.matches ?? [];
  const loadingDate = loading || (data !== null && data.date !== date);
  const effLayout = useMemo(() => ({ ...layout, dateLabel: { ...layout.dateLabel, text: layout.dateLabel.text || date } }), [layout, date]);
  const scale = PREVIEW_W / layout.width;
  const botolaCount = matches.filter((m) => m.leagueName === "Botola Pro").length;
  const finished = matches.filter((m) => m.isFinished).length;
  const live = matches.filter((m) => m.isLive).length;
  const results = mode === "results";
  // A results poster with nothing played yet would be all dimmed kickoff times.
  const exportBlock = results && matches.length > 0 && finished + live === 0
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
          <span className="muted">البطولة الاحترافية أولاً ثم أهم المباريات · تصدير 1080×1350 PNG</span>
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
              <div className="kv"><span>المباريات</span><b>{matches.length} / 10 (البطولة: {botolaCount})</b></div>
              {results && matches.length > 0 && (
                <div className="kv"><span>انتهت</span><b>{finished} من {matches.length}{live > 0 ? ` · ${live} مباشرة` : ""}</b></div>
              )}
              <div className="kv"><span>آخر تحديث</span><b>{dataForDate?.fetchedAt ? new Date(dataForDate.fetchedAt).toLocaleString() : "—"}</b></div>
              <div className="kv"><span>الحالة</span><span className={loadingDate ? "pill" : dataForDate?.stale ? "pill warn" : "pill ok"}>{loadingDate ? "جاري التحميل…" : dataForDate?.stale ? "نسخة مخزَّنة" : "متصل"}</span></div>
              {dataForDate?.errors && dataForDate.errors.length > 0 && (
                <ul className="warnlist">{dataForDate.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
              )}
              <button className="btn" disabled={loadingDate} onClick={() => fetchFixtures(date)}>{loadingDate ? "جاري التحديث…" : "تحديث"}</button>
            </div>
            <TemplateUploader isCustom={templateSrc !== null} onTemplate={onTemplate} defaultLabel="No template yet — using a plain background. Upload your matchday template." resetLabel="حذف القالب" />
            <ExportControls posterRef={posterRef} canExport={matches.length > 0} blocked={exportBlock} onResetDesign={() => updateLayout(DEFAULT_MATCHDAY_LAYOUT)} fileBase={results ? "choufsport-results" : "choufsport-matchday"} fileDate={date} />
            <MatchdayTeams matches={matches} nameOverrides={nameOverrides} logoOverrides={logoOverrides} onName={onName} onLogo={onLogo} onClearLogo={onClearLogo} />
            <MatchdayDesign layout={layout} onChange={updateLayout} />
          </section>

          <section className="previewpane">
            <div className="previewsticky">
              <h3 className="muted">معاينة مباشرة</h3>
              <div className="previewbox" style={{ width: PREVIEW_W, height: layout.height * scale }}>
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
