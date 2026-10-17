import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Poster from "@/components/Poster";
import Nav from "@/components/Nav";
import TemplateUploader from "@/components/TemplateUploader";
import CompetitionSelector from "@/components/CompetitionSelector";
import TeamMappingEditor from "@/components/TeamMappingEditor";
import DesignSettings from "@/components/DesignSettings";
import ExportControls from "@/components/ExportControls";
import { DEFAULT_LAYOUT, type LayoutConfig } from "@/config/defaultLayout";
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

const DEFAULT_TEMPLATE = "/templates/botola.jpg";
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
  const [layout, setLayout] = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const [logoOverrides, setLogoOverrides] = useState<Record<string, string>>({});
  const [templateSrc, setTemplateSrc] = useState<string>(DEFAULT_TEMPLATE);
  const [data, setData] = useState<StandingsState | null>(null);
  const [loading, setLoading] = useState(false);

  // Load persisted state on mount (client-only).
  useEffect(() => {
    setLayout(loadLayout(DEFAULT_LAYOUT));
    setNameOverrides(loadNameOverrides());
    getLogoOverrides().then(setLogoOverrides);
    getTemplate().then((t) => t && setTemplateSrc(t));
  }, []);

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/standings");
      const json = await res.json();
      if (!res.ok && !json.rows) {
        setData({
          rows: [],
          season: null,
          warnings: [],
          validation: { ok: false, errors: [json.error || "Request failed"], warnings: [] },
          stale: true,
          error: json.error,
        });
      } else {
        setData(json);
      }
    } catch (e) {
      setData({
        rows: [],
        season: null,
        warnings: [],
        validation: { ok: false, errors: [String(e)], warnings: [] },
        stale: true,
        error: String(e),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  const updateLayout = (next: LayoutConfig) => {
    setLayout(next);
    saveLayout(next);
  };
  const resetDesign = () => updateLayout(DEFAULT_LAYOUT);

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
      setTemplate(dataUrl);
    } else {
      setTemplateSrc(DEFAULT_TEMPLATE);
      clearTemplate();
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

  const blocked = data && !data.validation.ok ? data.validation.errors.join("; ") : null;
  const scale = PREVIEW_W / layout.width;

  return (
    <>
      <Head>
        <title>Botola Pro Standings Poster — Chouf TV</title>
      </Head>
      <main className="app">
        <header className="apphead">
          <h1>Botola Pro — Standings Poster</h1>
          <Nav />
          <span className="muted">Chouf TV · live GOAL API · 1080×1350</span>
        </header>

        <div className="layout">
          <section className="controls">
            <CompetitionSelector
              leagueName={data?.league?.name}
              season={data?.season}
              count={rows.length}
              fetchedAt={data?.fetchedAt}
              stale={Boolean(data?.stale)}
              error={data?.error}
              loading={loading}
              onRefresh={fetchStandings}
            />
            {data && data.validation.warnings.length > 0 && (
              <div className="card">
                <h3>Data warnings</h3>
                <ul className="warnlist">
                  {data.validation.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            <TemplateUploader isCustom={templateSrc !== DEFAULT_TEMPLATE} onTemplate={onTemplate} />
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

          <section className="previewpane">
            <div className="previewsticky">
              <h3 className="muted">Live preview</h3>
              <div className="previewbox" style={{ width: PREVIEW_W, height: layout.height * scale }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <Poster ref={posterRef} rows={rows} layout={layout} templateSrc={templateSrc} logoOverrides={logoOverrides} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
