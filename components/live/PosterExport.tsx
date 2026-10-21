import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import TemplateUploader from "../TemplateUploader";
import { clearTemplate, getTemplate, setTemplate } from "@/lib/db";
import { downloadPoster, posterFilename } from "@/lib/exportPoster";
import { deepMerge } from "@/lib/persist";

const PREVIEW_W = 420;

interface Props<L> {
  title: string;
  /** localStorage key the edited layout persists under. */
  layoutKey: string;
  /** IndexedDB key for this poster's uploaded template. */
  templateKey: string;
  defaults: L;
  fileBase: string;
  /** The poster's data has arrived (with its images inlined). */
  ready: boolean;
  error: string | null;
  onClose: () => void;
  poster: (ref: RefObject<HTMLDivElement>, layout: L, templateSrc: string | null) => ReactNode;
  design: (layout: L, onChange: (next: L) => void) => ReactNode;
  /** Shown under the preview, e.g. when the current settings leave it empty. */
  note?: (layout: L) => ReactNode;
  /** What goes on the poster (not how it looks): above the template and design. */
  aside?: ReactNode;
}

/**
 * The live section's poster popup: a scaled preview that is the export node
 * itself, the template, the design panel, and PNG/JPEG/reset — the same
 * contract as the poster pages, in a window over the kiosk.
 */
export default function PosterExport<L>({
  title, layoutKey, templateKey, defaults, fileBase, ready, error, onClose, poster, design, note, aside,
}: Props<L>) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<L>(defaults);
  const [templateSrc, setTemplateSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
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
    try {
      const r = localStorage.getItem(layoutKey);
      if (r) setLayout(deepMerge(defaults, JSON.parse(r)));
    } catch { /* keep the defaults */ }
    getTemplate(templateKey).then(setTemplateSrc);
  }, [layoutKey, templateKey, defaults]);

  const updateLayout = (n: L) => {
    setLayout(n);
    try { localStorage.setItem(layoutKey, JSON.stringify(n)); } catch { /* private mode */ }
  };
  const onTemplate = (d: string | null) => {
    if (d) { setTemplateSrc(d); setTemplate(d, templateKey); } else { setTemplateSrc(null); clearTemplate(templateKey); }
  };

  const save = async (format: "png" | "jpeg") => {
    if (!posterRef.current) return;
    setBusy(true);
    setFailed(null);
    try {
      await downloadPoster(posterRef.current, format, posterFilename(format, fileBase));
    } catch (e) {
      setFailed("تعذر التصدير: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!host) return null;
  const scale = PREVIEW_W / 1080;
  const shown = error ?? failed;

  return createPortal(
    <div className="kpc-back" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="kxp" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="kpc-x" onClick={onClose} aria-label="إغلاق">×</button>
        <h3>{title}</h3>

        {shown && <p className="kxp-err">{shown}</p>}
        {!ready && !error && <p className="kxp-wait"><i className="spinner" />جاري تجهيز الملصق…</p>}

        {ready && !error && (
          <div className="kxp-body">
            <div className="kxp-left">
              {/* The preview is the export node, so it is scaled, never resized. */}
              <div className="kxp-preview" style={{ width: PREVIEW_W, height: 1350 * scale }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  {poster(posterRef, layout, templateSrc)}
                </div>
              </div>
              {note?.(layout)}
              <div className="kxp-actions">
                <button type="button" className="kxp-btn primary" disabled={busy} onClick={() => save("png")}>
                  {busy && <i className="spinner" />}تحميل PNG (1080×1350)
                </button>
                <button type="button" className="kxp-btn" disabled={busy} onClick={() => save("jpeg")}>تحميل JPEG</button>
                <button type="button" className="kxp-btn" onClick={() => updateLayout(defaults)}>إعادة ضبط التصميم</button>
              </div>
            </div>
            <div className="kxp-right">
              {aside}
              <TemplateUploader isCustom={Boolean(templateSrc)} onTemplate={onTemplate} defaultLabel="لا يوجد قالب — تُستخدم خلفية الملصق الافتراضية." />
              {design(layout, updateLayout)}
            </div>
          </div>
        )}
      </div>
    </div>,
    host
  );
}
