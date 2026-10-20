import Head from "next/head";
import { useCachedData } from "@/lib/useCachedData";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Nav from "@/components/Nav";
import StatsPoster from "@/components/StatsPoster";
import TemplateUploader from "@/components/TemplateUploader";
import ExportControls from "@/components/ExportControls";
import { DEFAULT_STATS_LAYOUT, type StatsLayout } from "@/config/statsLayout";
import { leaguesByGroup, BOTOLA_LEAGUE, leagueById } from "@/config/standingsLeagues";
import type { StatCategory } from "@/lib/scores365Stats";
import { deepMerge } from "@/lib/persist";
import { getTemplate, setTemplate, clearTemplate } from "@/lib/db";

const PREVIEW_W = 480;
const LKEY = "botola.statsLayout";
const LEAGUE_KEY = "botola.statsLeague";
const CAT_KEY = "botola.statsCategory";

const loadLayout = (): StatsLayout => {
  try { const r = localStorage.getItem(LKEY); return r ? deepMerge(DEFAULT_STATS_LAYOUT, JSON.parse(r)) : DEFAULT_STATS_LAYOUT; } catch { return DEFAULT_STATS_LAYOUT; }
};
const saveLayout = (l: StatsLayout) => { try { localStorage.setItem(LKEY, JSON.stringify(l)); } catch { /* ignore */ } };

interface StatsState { competition: number; categories: StatCategory[]; fetchedAt?: string; error?: string }

export default function StatsPage() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [league, setLeague] = useState<number>(BOTOLA_LEAGUE);
  const [catKey, setCatKey] = useState<string>("");
  const [layout, setLayout] = useState<StatsLayout>(DEFAULT_STATS_LAYOUT);
  const [templateSrc, setTemplateSrc] = useState<string | null>(null);

  useEffect(() => {
    let lg = BOTOLA_LEAGUE;
    try {
      const s = localStorage.getItem(LEAGUE_KEY); if (s) lg = Number(s);
      const c = localStorage.getItem(CAT_KEY); if (c) setCatKey(c);
    } catch { /* ignore */ }
    setLeague(lg);
    setLayout(loadLayout());
    getTemplate("stats").then(setTemplateSrc);
  }, []);

  // Last answer first, from IndexedDB, then the server behind it.
  const readStats = useCallback(async (): Promise<StatsState> => {
    const res = await fetch(`/api/stats?competition=${league}`);
    const json = await res.json();
    return { competition: league, categories: json.categories ?? [], fetchedAt: json.fetchedAt, error: json.error };
  }, [league]);

  const { data, loading, busy, refresh: fetchStats } =
    useCachedData<StatsState>(`stats:${league}`, readStats);

  const forLeague = data && data.competition === league ? data : null;
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
  const pickCat = (k: string) => { setCatKey(k); try { localStorage.setItem(CAT_KEY, k); } catch { /* ignore */ } };
  const updateLayout = (n: StatsLayout) => { setLayout(n); saveLayout(n); };
  const onTemplate = (d: string | null) => { if (d) { setTemplateSrc(d); setTemplate(d, "stats"); } else { setTemplateSrc(null); clearTemplate("stats"); } };

  const subtitle = useMemo(() => {
    const parts = [leagueById(league)?.ar ?? ""];
    if (category?.average) parts.push(`${category.average.text}: ${category.average.value}`);
    return parts.filter(Boolean).join(" · ");
  }, [league, category]);

  const scale = PREVIEW_W / layout.width;
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
          <span className="muted">{leagueById(league)?.ar} · تصنيف اللاعبين والفرق · مباشر من 365scores · تصدير 1080×1350 PNG</span>
        </div>

        <div className="layout">
          <section className="controls">
            <div className="card">
              <h3>التصنيف</h3>
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
              <label className="field wide">
                <span>عرض الأوائل</span>
                <input type="number" min={3} max={20} value={layout.topN} onChange={(e) => updateLayout({ ...layout, topN: Math.max(3, Math.min(20, Number(e.target.value) || 10)) })} />
              </label>
              <div className="kv"><span>عدد السطور</span><b>{rows.length} سطر متاح</b></div>
              <div className="kv"><span>آخر تحديث</span><b>{forLeague?.fetchedAt ? new Date(forLeague.fetchedAt).toLocaleString() : "—"}</b></div>
              <div className="kv"><span>الحالة</span><span className={loading ? "pill" : forLeague?.error ? "pill warn" : "pill ok"}>{loading ? "جاري التحميل…" : forLeague?.error ? "خطأ" : "متصل"}</span></div>
              {empty && <p className="err">365scores publishes no stat leaderboards for this competition.</p>}
              {forLeague?.error && <p className="err">{forLeague.error}</p>}
              <button className="btn" disabled={loading} onClick={() => fetchStats()}>{loading ? "جاري التحديث…" : "تحديث"}</button>
            </div>

            <TemplateUploader isCustom={templateSrc !== null} onTemplate={onTemplate} defaultLabel="No template yet — using a plain background. Upload your stats template." resetLabel="حذف القالب" />
            <ExportControls posterRef={posterRef} canExport={rows.length > 0} blocked={rows.length === 0 ? "لا توجد بيانات لهذه الإحصائية بعد" : null} onResetDesign={() => updateLayout(DEFAULT_STATS_LAYOUT)} fileBase={`choufsport-stats-${catKey || "none"}`} />

            <div className="card">
              <h3>التصميم</h3>
              <div className="grid2">
                <label className="field"><span>حجم العنوان</span><input type="number" value={layout.title.fontSize} onChange={(e) => updateLayout({ ...layout, title: { ...layout.title, fontSize: Number(e.target.value) } })} /></label>
                <label className="field"><span>ارتفاع الصف</span><input type="number" value={layout.rowHeight} onChange={(e) => updateLayout({ ...layout, rowHeight: Number(e.target.value) })} /></label>
                <label className="field"><span>موضع أول صف</span><input type="number" value={layout.firstRowCenterY} onChange={(e) => updateLayout({ ...layout, firstRowCenterY: Number(e.target.value) })} /></label>
                <label className="field"><span>حجم الصورة</span><input type="number" value={layout.photoSize} onChange={(e) => updateLayout({ ...layout, photoSize: Number(e.target.value) })} /></label>
                <label className="field"><span>حجم الاسم</span><input type="number" value={layout.nameFontSize} onChange={(e) => updateLayout({ ...layout, nameFontSize: Number(e.target.value) })} /></label>
                <label className="field"><span>حجم القيمة</span><input type="number" value={layout.valueFontSize} onChange={(e) => updateLayout({ ...layout, valueFontSize: Number(e.target.value) })} /></label>
              </div>
              <label className="field"><span>إظهار السطر الإضافي</span><input type="checkbox" checked={layout.showSecondary} onChange={(e) => updateLayout({ ...layout, showSecondary: e.target.checked })} /></label>
              <label className="field"><span>بطاقة الصف</span><input type="checkbox" checked={layout.rowBg.show} onChange={(e) => updateLayout({ ...layout, rowBg: { ...layout.rowBg, show: e.target.checked } })} /></label>
            </div>
          </section>

          <section className="previewpane">
            <div className="previewsticky">
              <h3 className="muted">معاينة مباشرة</h3>
              <div className={busy ? "previewbox busy" : "previewbox"} style={{ width: PREVIEW_W, height: layout.height * scale }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <StatsPoster ref={posterRef} title={category?.name ?? ""} subtitle={subtitle} rows={rows} layout={layout} templateSrc={templateSrc} kind={category?.kind ?? "player"} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
