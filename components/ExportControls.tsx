import { useState, type RefObject } from "react";
import { downloadPoster, posterFilename } from "@/lib/exportPoster";
import { useLang } from "@/lib/prefs";

interface Props {
  posterRef: RefObject<HTMLDivElement>;
  canExport: boolean;
  blocked?: string | null; // validation errors block export
  preparing?: string | null; // not an error: images still arriving, export waits
  onResetDesign: () => void;
  fileBase?: string;
  fileDate?: string; // defaults to today
}

// Download the 1080x1350 poster as PNG or JPEG. The preview IS the export node,
// so what you see is what downloads (no separate "generate" step).
export default function ExportControls({ posterRef, canExport, blocked, preparing, onResetDesign, fileBase = "botola-pro-standings", fileDate }: Props) {
  const { t } = useLang();
  const [busy, setBusy] = useState<string | null>(null);
  // Inline, not alert(): a native dialog blocks the kiosk until someone taps it.
  const [failed, setFailed] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function run(format: "png" | "jpeg") {
    if (!posterRef.current) return;
    setBusy(format);
    setFailed(null);
    setDone(false);
    try {
      await downloadPoster(posterRef.current, format, posterFilename(format, fileBase, fileDate));
      setDone(true);
      setTimeout(() => setDone(false), 2400);
    } catch (e) {
      setFailed(t("تعذر التصدير: ", "Export failed: ") + (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card">
      <h3>{t("التصدير")}</h3>
      {blocked && <p className="err">{t("تعذر التصدير: ")}{blocked}</p>}
      {!blocked && preparing && <p className="preparing" role="status"><i className="spinner" aria-hidden="true" />{preparing}</p>}
      {failed && <p className="err">{failed}</p>}
      {done && <p className="saved" role="status">{t("تم تحميل الملصق", "Poster downloaded")}</p>}
      <div className="row">
        <button className="btn primary" disabled={!canExport || !!busy || !!blocked || !!preparing} onClick={() => run("png")}>
          {busy === "png" && <i className="spinner" aria-hidden="true" />}
          {busy === "png" ? t("جاري التجهيز…", "Preparing…") : t("تحميل PNG (1080×1350)", "Download PNG (1080×1350)")}
        </button>
        <button className="btn" disabled={!canExport || !!busy || !!blocked || !!preparing} onClick={() => run("jpeg")}>
          {busy === "jpeg" && <i className="spinner" aria-hidden="true" />}
          {busy === "jpeg" ? t("جاري التجهيز…", "Preparing…") : t("تحميل JPEG", "Download JPEG")}
        </button>
      </div>
      <button className="btn ghost" onClick={onResetDesign}>{t("إعادة ضبط التصميم (مع الإبقاء على الأسماء والشعارات)")}</button>
    </div>
  );
}
