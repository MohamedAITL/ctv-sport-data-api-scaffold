import Head from "next/head";
import { useCachedData } from "@/lib/useCachedData";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Poster from "@/components/Poster";
import Nav from "@/components/Nav";
import TemplateUploader from "@/components/TemplateUploader";
import CompetitionSelector from "@/components/CompetitionSelector";
import TeamMappingEditor from "@/components/TeamMappingEditor";
import DesignSettings from "@/components/DesignSettings";
import ExportControls from "@/components/ExportControls";
import { DEFAULT_LAYOUT, defaultLayoutFor, type LayoutConfig } from "@/config/defaultLayout";
import { DEFAULT_LEAGUE, BOTOLA_LEAGUE, leagueById } from "@/config/standingsLeagues";
import type { TeamRow } from "@/types/standings";
import { loadLayout, saveLayout, loadNameOverrides, saveNameOverrides } from "@/lib/persist";
import {
  getLogoOverrides,
  setLogoOverride,
  clearLogoOverride,
  getTemplate,
  setTemplate,
  clearTemplate,
} from "@/lib/db";
import { useFitWidth } from "@/lib/useFitWidth";

const BOTOLA_TEMPLATE = "/templates/botola.jpg";
// Only Botola ships with a bundled template; other leagues start on a plain
// background until the user uploads their own.
const defaultTemplateFor = (league: number) => (league === BOTOLA_LEAGUE ? BOTOLA_TEMPLATE : "");
const templateKey = (league: number) => `standings:${league}`;
const LEAGUE_KEY = "botola.league";
const PREVIEW_W = 480;

interface StandingsState {
  rows: TeamRow[];
  season: string | null;
  league?: { id?: string; name?: string };
  warnings: string[];
  validation: { ok: boolean; errors: string[]; warnings: string[] };
  fetchedAt?: string;
  stale: boolean;
  error?: string | null;
}


export default function Home() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [paneRef, previewW] = useFitWidth<HTMLElement>(PREVIEW_W);
  const [league, setLeague] = useState<number>(DEFAULT_LEAGUE);
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const [logoOverrides, setLogoOverrides] = useState<Record<string, string>>({});
  const [templateSrc, setTemplateSrc] = useState<string>(BOTOLA_TEMPLATE);


  // Load persisted state for the current league (client-only).
  useEffect(() => {
    let initial = DEFAULT_LEAGUE;
    try { const s = localStorage.getItem(LEAGUE_KEY); if (s) initial = Number(s); } catch { /* ignore */ }
    setLeague(initial);
    setLayout(loadLayout(defaultLayoutFor(initial), String(initial)));
    setNameOverrides(loadNameOverrides());
    getLogoOverrides().then(setLogoOverrides);
    getTemplate(templateKey(initial)).then((t) => setTemplateSrc(t || defaultTemplateFor(initial)));
  }, []);

  // Whatever this league last returned is shown at once from IndexedDB, then
  // the server is asked behind it — so switching league or reloading the page
  // never shows an empty poster.
  const readStandings = useCallback(async (): Promise<StandingsState> => {
    const res = await fetch(`/api/standings?competition=${league}`);
    const json = await res.json();
    // A failed request must not replace the table on screen (or the cached one)
    // with an empty one: throwing keeps what we have and reports the error.
    if (!res.ok && !json.rows) throw new Error(json.error || "فشل الطلب");
    return json as StandingsState;
  }, [league]);

  const { data, loading, busy, error: loadError, refresh: refreshStandings } =
    useCachedData<StandingsState>(`standings:${league}`, readStandings);
  const fetchStandings = refreshStandings;

  const onLeague = (id: number) => {
    if (id === league) return;
    try { localStorage.setItem(LEAGUE_KEY, String(id)); } catch { /* ignore */ }
    setLayout(loadLayout(defaultLayoutFor(id), String(id)));
    getTemplate(templateKey(id)).then((t) => setTemplateSrc(t || defaultTemplateFor(id)));
    setLeague(id); // the hook swaps in that league's cached table, then refreshes
  };

  const updateLayout = (next: LayoutConfig) => {
    setLayout(next);
    saveLayout(next, String(league));
  };
  const resetDesign = () => updateLayout(defaultLayoutFor(league));

  const onName = (teamId: string, value: string) => {
    setNameOverrides((prev) => {
      const next = { ...prev, [teamId]: value };
      saveNameOverrides(next);
      return next;
    });
  };
  const onLogo = (teamId: string, dataUrl: string) => {
    setLogoOverrides((prev) => ({ ...prev, [teamId]: dataUrl }));
    setLogoOverride(teamId, dataUrl);
  };
  const onClearLogo = (teamId: string) => {
    setLogoOverrides((prev) => {
      const next = { ...prev };
      delete next[teamId];
      return next;
    });
    clearLogoOverride(teamId);
  };
  const onTemplate = (dataUrl: string | null) => {
    if (dataUrl) {
      setTemplateSrc(dataUrl);
      setTemplate(dataUrl, templateKey(league));
    } else {
      setTemplateSrc(defaultTemplateFor(league));
      clearTemplate(templateKey(league));
    }
  };

  // Apply client-side Arabic-name overrides on top of the server rows.
  const rows: TeamRow[] = useMemo(
    () =>
      (data?.rows || []).map((r) => ({
        ...r,
        nameAr: nameOverrides[r.teamId] ?? r.nameAr,
      })),
    [data, nameOverrides]
  );

  // The full-canvas preset ships a blank heading; fill it with the league's
  // Arabic name, since no template supplies one for those leagues.
  // The bundled template is the reference poster with an old table baked in,
  // so its rows are always masked; an uploaded (clean) template follows the
  // switch in the design panel.
  const effLayout = useMemo(() => {
    const masked = templateSrc === BOTOLA_TEMPLATE && !layout.mask.show
      ? { ...layout, mask: { ...layout.mask, show: true } }
      : layout;
    if (masked.heading.text) return masked;
    return { ...masked, heading: { ...masked.heading, text: leagueById(league)?.ar ?? "" } };
  }, [layout, league, templateSrc]);

  // A knockout cup, or a competition between seasons, simply has no table yet.
  // That is a normal state, so say it plainly instead of surfacing the raw
  // "الجدول فارغ" validation error.
  const noTable = Boolean(data) && !loading && rows.length === 0;
  const blocked = noTable
    ? "لا يوجد جدول ترتيب منشور لهذه المسابقة حالياً"
    : data && !data.validation.ok
    ? data.validation.errors.join("; ")
    : null;
  const scale = previewW / layout.width;

  return (
    <>
      <Head>
        <title>ملصق الترتيب — شوف تي في</title>
      </Head>
      <main className="app">
        <header className="topbar">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brandlogo" src="/chouftv-logo.png" alt="Chouf TV" />
          </div>
          <Nav />
        </header>
        <div className="pagehead">
          <h1>ملصق الترتيب</h1>
          <span className="muted">{leagueById(league)?.ar ?? "البطولة"} · جدول مباشر · تصدير 1080×1350 PNG</span>
        </div>

        <div className="layout">
          <section className="controls">
            <CompetitionSelector
              league={league}
              onLeague={onLeague}
              season={data?.season}
              count={rows.length}
              fetchedAt={data?.fetchedAt}
              stale={Boolean(data?.stale)}
              error={loadError ?? data?.error}
              loading={loading || busy}
              onRefresh={fetchStandings}
            />
            {noTable && (
              <div className="card">
                <h3>لا يوجد جدول</h3>
                <p className="err" style={{ direction: "rtl" }}>لا يوجد جدول ترتيب لهذه المسابقة حاليا</p>
                <p className="muted">يُنشر الجدول فقط بعد انطلاق الدوري أو دور المجموعات. اختر مسابقة أخرى أو عد عند انطلاقها.</p>
              </div>
            )}
            {data && data.validation.warnings.length > 0 && (
              <div className="card">
                <h3>ملاحظات على البيانات</h3>
                <ul className="warnlist">
                  {data.validation.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            <TemplateUploader isCustom={templateSrc !== defaultTemplateFor(league)} onTemplate={onTemplate} />
            <ExportControls posterRef={posterRef} canExport={rows.length > 0} blocked={blocked} onResetDesign={resetDesign} />
            <TeamMappingEditor
              rows={rows}
              nameOverrides={nameOverrides}
              logoOverrides={logoOverrides}
              onName={onName}
              onLogo={onLogo}
              onClearLogo={onClearLogo}
            />
            <DesignSettings layout={layout} onChange={updateLayout} />
          </section>

          <section className="previewpane" ref={paneRef}>
            <div className="previewsticky">
              <h3 className="muted">معاينة مباشرة</h3>
              <div className={busy ? "previewbox busy" : "previewbox"} style={{ width: previewW, height: layout.height * scale }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <Poster ref={posterRef} rows={rows} layout={effLayout} templateSrc={templateSrc} logoOverrides={logoOverrides} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
