import { useState, type RefObject } from "react";
import { downloadPoster, posterFilename } from "@/lib/exportPoster";

interface Props {
  posterRef: RefObject<HTMLDivElement>;
  canExport: boolean;
  blocked?: string | null; // validation errors block export
  onResetDesign: () => void;
}

// Download the 1080x1350 poster as PNG or JPEG. The preview IS the export node,
// so what you see is what downloads (no separate "generate" step).
export default function ExportControls({ posterRef, canExport, blocked, onResetDesign }: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  async function run(format: "png" | "jpeg") {
    if (!posterRef.current) return;
    setBusy(format);
    try {
      await downloadPoster(posterRef.current, format, posterFilename(format));
    } catch (e) {
      alert("Export failed: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card">
      <h3>Export</h3>
      {blocked && <p className="err">Cannot export: {blocked}</p>}
      <div className="row">
        <button className="btn primary" disabled={!canExport || !!busy || !!blocked} onClick={() => run("png")}>
          {busy === "png" ? "Rendering…" : "Download PNG (1080×1350)"}
        </button>
        <button className="btn" disabled={!canExport || !!busy || !!blocked} onClick={() => run("jpeg")}>
          {busy === "jpeg" ? "Rendering…" : "Download JPEG"}
        </button>
      </div>
      <button className="btn ghost" onClick={onResetDesign}>Reset design (keeps names & logos)</button>
    </div>
  );
}
