import Head from "next/head";
import { useCachedData } from "@/lib/useCachedData";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Nav from "@/components/Nav";
import StatsPoster from "@/components/StatsPoster";
import TemplateUploader from "@/components/TemplateUploader";
import ExportControls from "@/components/ExportControls";
import StatsDesign from "@/components/StatsDesign";
import TotwStudio from "@/components/TotwStudio";
import MoroccanStudio from "@/components/MoroccanStudio";
import { DEFAULT_STATS_LAYOUT, type StatsLayout } from "@/config/statsLayout";
import { leaguesByGroup, BOTOLA_LEAGUE, leagueById } from "@/config/standingsLeagues";
import type { StatCategory } from "@/lib/scores365Stats";
import { deepMerge } from "@/lib/persist";
import { getTemplate, setTemplate, clearTemplate } from "@/lib/db";
import { useFitWidth } from "@/lib/useFitWidth";

const PREVIEW_W = 480;
const LKEY = "botola.statsLayout";
const LEAGUE_KEY = "botola.statsLeague";
const CAT_KEY = "botola.statsCategory";
const MODE_KEY = "botola.statsMode";
type Mode = "stats" | "totw" | "moroccans";

const loadLayout = (): StatsLayout => {
  try { const r = localStorage.getItem(LKEY); return r ? deepMerge(DEFAULT_STATS_LAYOUT, JSON.parse(r)) : DEFAULT_STATS_LAYOUT; } catch { return DEFAULT_STATS_LAYOUT; }
};
const saveLayout = (l: StatsLayout) => { try { localStorage.setItem(LKEY, JSON.stringify(l)); } catch { /* ignore */ } };

interface StatsState { competition: number; categories: StatCategory[]; fetchedAt?: string; error?: string }

export default function StatsPage() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [paneRef, previewW] = useFitWidth<HTMLElement>(PREVIEW_W);
  const [league, setLeague] = useState<number>(BOTOLA_LEAGUE);
  const [catKey, setCatKey] = useState<string>("");
  const [layout, setLayout] = useState<StatsLayout>(DEFAULT_STATS_LAYOUT);
  const [templateSrc, setTemplateSrc] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("stats");

  useEffect(() => {
    let lg = BOTOLA_LEAGUE;
    try {
      const s = localStorage.getItem(LEAGUE_KEY); if (s) lg = Number(s);
      const c = localStorage.getItem(CAT_KEY); if (c) setCatKey(c);
      const m = localStorage.getItem(MODE_KEY);
      if (m === "totw" || m === "moroccans") setMode(m);
    } catch { /* ignore */ }
    setLeague(lg);
    setLayout(loadLayout());
    getTemplate("stats").then(setTemplateSrc);
  }, []);

  // Last answer first, from IndexedDB, then the server behind it.
  const readStats = useCallback(async (): Promise<StatsState> => {
    const res = await fetch(`/api/stats?competition=${league}`);
    const json = await res.json();
    // Thrown, not returned: an empty answer would replace the leaderboards on
    // screen and the cached copy.
    if (!res.ok) throw new Error(json.error || "فشل الطلب");
    return { competition: league, categories: json.categories ?? [], fetchedAt: json.fetchedAt, error: json.error };
  }, [league]);

  const { data, loading, busy, error: loadError, refresh: fetchStats } =
    useCachedData<StatsState>(mode === "stats" ? `stats:${league}` : null, readStats);

  const forLeague = data && data.competition === league ? data : null;
  // A failed refresh keeps the last data on screen and says why.
  const shownError = loadError ?? forLeague?.error ?? null;
  const categories = useMemo(() => forLeague?.categories ?? [], [forLeague]);

  useEffect(() => {
    if (categories.length === 0) return;
    setCatKey((cur) => (cur && categories.some((c) => c.key === cur) ? cur : categories[0].key));
  }, [categories]);

  const category = categories.find((c) => c.key === catKey) ?? null;

  const pickLeague = (id: number) => {
    if (id === league) return;
    try { localStorage.setItem(LEAGUE_KEY, String(id)); } catch { /* ignore */ }
    setLeague(id); // the hook swaps in that league's cached payload, then refreshes
  };
  const pickMode = (m: Mode) => { setMode(m); try { localStorage.setItem(MODE_KEY, m); } catch { /* ignore */ } };
  const pickCat = (k: string) => { setCatKey(k); try { localStorage.setItem(CAT_KEY, k); } catch { /* ignore */ } };
  const updateLayout = (n: StatsLayout) => { setLayout(n); saveLayout(n); };
  const onTemplate = (d: string | null) => { if (d) { setTemplateSrc(d); setTemplate(d, "stats"); } else { setTemplateSrc(null); clearTemplate("stats"); } };

  const subtitle = useMemo(() => {
    const parts = [leagueById(league)?.ar ?? ""];
    if (category?.average) parts.push(`${category.average.text}: ${category.average.value}`);
    return parts.filter(Boolean).join(" · ");
  }, [league, category]);

  const scale = previewW / layout.width;
  const leagueField = (
    <label className="field wide">
      <span>البطولة</span>
      <select value={league} onChange={(e) => pickLeague(Number(e.target.value))} disabled={loading}>
        {leaguesByGroup().map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.leagues.map((l) => <option key={l.id} value={l.id}>{l.ar}</option>)}
          </optgroup>
        ))}
      </select>
    </label>
  );
  const rows = category?.rows ?? [];
  const empty = !loading && forLeague !== null && categories.length === 0;

  return (
    <>
      <Head><title>ملصق الإحصائيات — شوف تي في</title></Head>
      <main className="app">
        <header className="topbar">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brandlogo" src="/chouftv-logo.png" alt="Chouf TV" />
          </div>
          <Nav />
        </header>
        <div className="pagehead">
          <h1>ملصق الإحصائيات</h1>
          <span className="muted">{leagueById(league)?.ar} · تصنيف اللاعبين والفرق وتشكيلة الجولة والمغاربة · مباشر · تصدير 1080×1350 PNG</span>
          <div className="seg" role="tablist" aria-label="نوع الملصق" style={{ marginTop: 14, maxWidth: 560 }}>
            <button role="tab" aria-selected={mode === "stats"} className={mode === "stats" ? "seg-btn on" : "seg-btn"} onClick={() => pickMode("stats")}>الإحصائيات</button>
            <button role="tab" aria-selected={mode === "totw"} className={mode === "totw" ? "seg-btn on" : "seg-btn"} onClick={() => pickMode("totw")}>تشكيلة الجولة</button>
            <button role="tab" aria-selected={mode === "moroccans"} className={mode === "moroccans" ? "seg-btn on" : "seg-btn"} onClick={() => pickMode("moroccans")}>المغاربة</button>
          </div>
        </div>

        {mode === "moroccans" ? <MoroccanStudio /> : mode === "totw" ? <TotwStudio league={league} leagueField={leagueField} /> : (
        <div className="layout">
          <section className="controls">
            <div className="card">
              <h3>التصنيف</h3>
              {leagueField}
              <label className="field wide">
                <span>الإحصائية</span>
                <select value={catKey} onChange={(e) => pickCat(e.target.value)} disabled={loading || categories.length === 0}>
                  {categories.length === 0 && <option value="">—</option>}
                  {categories.filter((c) => c.kind === "player").length > 0 && (
                    <optgroup label="اللاعبون · Players">
                      {categories.filter((c) => c.kind === "player").map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
                    </optgroup>
                  )}
                  {categories.filter((c) => c.kind === "team").length > 0 && (
                    <optgroup label="الفرق · Teams">
                      {categories.filter((c) => c.kind === "team").map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
                    </optgroup>
                  )}
                </select>
              </label>
              <div className="kv"><span>عدد السطور</span><b>{rows.length} سطر متاح</b></div>
              <div className="kv"><span>آخر تحديث</span><b>{forLeague?.fetchedAt ? new Date(forLeague.fetchedAt).toLocaleString() : "—"}</b></div>
              <div className="kv"><span>الحالة</span><span className={loading ? "pill" : shownError ? "pill warn" : "pill ok"}>{loading ? "جاري التحميل…" : shownError ? "خطأ" : "متصل"}</span></div>
              {empty && <p className="err">لا تتوفر تصنيفات إحصائية لهذه المسابقة.</p>}
              {shownError && <p className="err">{shownError}</p>}
              <button className="btn" disabled={loading} onClick={() => fetchStats()}>{loading ? "جاري التحديث…" : "تحديث"}</button>
            </div>

            <TemplateUploader isCustom={templateSrc !== null} onTemplate={onTemplate} defaultLabel="لا يوجد قالب بعد — يتم استخدام خلفية بسيطة. ارفع قالب الإحصائيات." resetLabel="حذف القالب" />
            <ExportControls posterRef={posterRef} canExport={rows.length > 0} blocked={rows.length === 0 ? "لا توجد بيانات لهذه الإحصائية بعد" : null} onResetDesign={() => updateLayout(DEFAULT_STATS_LAYOUT)} fileBase={`choufsport-stats-${catKey || "none"}`} />

            <StatsDesign layout={layout} onChange={updateLayout} />
          </section>

          <section className="previewpane" ref={paneRef}>
            <div className="previewsticky">
              <h3 className="muted">معاينة مباشرة</h3>
              <div className={busy ? "previewbox busy" : "previewbox"} style={{ width: previewW, height: layout.height * scale }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <StatsPoster ref={posterRef} title={category?.name ?? ""} subtitle={subtitle} rows={rows} layout={layout} templateSrc={templateSrc} kind={category?.kind ?? "player"} />
                </div>
              </div>
            </div>
          </section>
        </div>
        )}
      </main>
    </>
  );
}
