import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import H2HPoster from "./H2HPoster";
import H2HDesign from "./H2HDesign";
import TemplateUploader from "../TemplateUploader";
import { DEFAULT_H2H_LAYOUT, type H2HLayout } from "@/config/h2hLayout";
import { clearTemplate, getTemplate, setTemplate } from "@/lib/db";
import { downloadPoster, posterFilename } from "@/lib/exportPoster";
import { deepMerge } from "@/lib/persist";
import { h2hRecord } from "@/lib/h2hRecord";
import type { H2HRecord, LiveMatch, PastMatch } from "@/types/live";

const PREVIEW_W = 420;
const LKEY = "botola.h2hLayout";

const loadLayout = (): H2HLayout => {
  try {
    const r = localStorage.getItem(LKEY);
    return r ? deepMerge(DEFAULT_H2H_LAYOUT, JSON.parse(r)) : DEFAULT_H2H_LAYOUT;
  } catch { return DEFAULT_H2H_LAYOUT; }
};
const saveLayout = (l: H2HLayout) => { try { localStorage.setItem(LKEY, JSON.stringify(l)); } catch { /* ignore */ } };

/**
 * Exports the head-to-head as a 1080x1350 poster, the same contract as the
 * other posters: what the preview shows is the node that gets captured, and
 * every value is editable and persisted.
 *
 * The crests have to be data URLs — html-to-image cannot read cross-origin
 * pixels — so the meetings are re-fetched with `inline=1` when this opens,
 * rather than slowing the tab for everyone who never exports.
 */
export default function H2HExport({ match, onClose }: { match: LiveMatch; onClose: () => void }) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<PastMatch[] | null>(null);
  const [record, setRecord] = useState<H2HRecord | null>(null);
  const [layout, setLayout] = useState<H2HLayout>(DEFAULT_H2H_LAYOUT);
  const [templateSrc, setTemplateSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [host, setHost] = useState<Element | null>(null);

  // In native fullscreen the browser paints only that subtree, so the overlay
  // has to live inside it.
  useEffect(() => {
    const pick = () => setHost(document.fullscreenElement ?? document.body);
    pick();
    document.addEventListener("fullscreenchange", pick);
    return () => document.removeEventListener("fullscreenchange", pick);
  }, []);

  useEffect(() => {
    setLayout(loadLayout());
    getTemplate("h2h").then(setTemplateSrc);
  }, []);

  useEffect(() => {
    let live = true;
    const url = `/api/live/previous?game=${match.id}&matchup=${encodeURIComponent(match.matchupId)}`
      + `&home=${match.home.id}&away=${match.away.id}&competition=${match.competitionId}&inline=1`;
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        if (!j.previous?.h2h?.length) { setError("لا توجد مواجهات سابقة لتصديرها."); return; }
        setRows(j.previous.h2h);
        setRecord(j.previous.record);
      })
      .catch(() => { if (live) setError("تعذر تجهيز الملصق."); });
    return () => { live = false; };
  }, [match]);

  const updateLayout = (n: H2HLayout) => { setLayout(n); saveLayout(n); };
  const onTemplate = (d: string | null) => {
    if (d) { setTemplateSrc(d); setTemplate(d, "h2h"); } else { setTemplateSrc(null); clearTemplate("h2h"); }
  };

  const save = async (format: "png" | "jpeg") => {
    if (!posterRef.current) return;
    setBusy(true);
    try {
      const base = `choufsport-h2h-${match.home.id}-${match.away.id}`;
      await downloadPoster(posterRef.current, format, posterFilename(format, base));
    } catch (e) {
      setError("تعذر التصدير: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!host) return null;
  const scale = PREVIEW_W / 1080;
  // The poster is about this tie in this competition: a Champions League night
  // is not told by two friendlies. The id, not the name — the same competition
  // reads "… - ربع النهائي" once the knockout starts.
  const meetings = rows && layout.sameCompetitionOnly
    ? rows.filter((m) => m.competitionId === match.competitionId)
    : rows;
  const shownRecord = rows && record
    ? (layout.sameCompetitionOnly ? h2hRecord(meetings ?? [], match.home.name) : record)
    : null;

  return createPortal(
    <div className="kpc-back" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="kxp" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="kpc-x" onClick={onClose} aria-label="إغلاق">×</button>
        <h3>ملصق المواجهات المباشرة</h3>

        {error && <p className="kxp-err">{error}</p>}
        {!rows && !error && <p className="kxp-wait"><i className="spinner" />جاري تجهيز الملصق…</p>}

        {rows && meetings && shownRecord && (
          <div className="kxp-body">
            <div className="kxp-left">
              {/* The preview is the export node, so it is scaled, never resized. */}
              <div className="kxp-preview" style={{ width: PREVIEW_W, height: 1350 * scale }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <H2HPoster ref={posterRef} match={match} meetings={meetings} record={shownRecord} layout={layout} templateSrc={templateSrc} />
                </div>
              </div>
              {meetings.length === 0 && (
                <p className="kxp-note">لم يلتق الفريقان من قبل في {match.competition} — أطفئ «هذه المسابقة فقط» لعرض كل المواجهات.</p>
              )}
              <div className="kxp-actions">
                <button type="button" className="kxp-btn primary" disabled={busy} onClick={() => save("png")}>
                  {busy && <i className="spinner" />}تحميل PNG (1080×1350)
                </button>
                <button type="button" className="kxp-btn" disabled={busy} onClick={() => save("jpeg")}>تحميل JPEG</button>
                <button type="button" className="kxp-btn" onClick={() => updateLayout(DEFAULT_H2H_LAYOUT)}>إعادة ضبط التصميم</button>
              </div>
            </div>
            <div className="kxp-right">
              <TemplateUploader isCustom={Boolean(templateSrc)} onTemplate={onTemplate} defaultLabel="لا يوجد قالب — تُستخدم خلفية الملصق الافتراضية." />
              <H2HDesign layout={layout} onChange={updateLayout} />
            </div>
          </div>
        )}
      </div>
    </div>,
    host
  );
}
