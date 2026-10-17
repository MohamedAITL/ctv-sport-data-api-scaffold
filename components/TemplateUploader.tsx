import { useRef } from "react";
import { fileToDataUrl } from "@/lib/file";

interface Props {
  isCustom: boolean;
  onTemplate: (dataUrl: string | null) => void; // null -> reset to default
  defaultLabel?: string;
  resetLabel?: string;
}

// Upload a PNG/JPG template (stored in IndexedDB by the page) or reset to the
// bundled Chouf TV reference poster.
export default function TemplateUploader({ isCustom, onTemplate, defaultLabel = "Using the bundled Chouf TV reference poster.", resetLabel = "Reset to reference" }: Props) {
  const input = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onTemplate(await fileToDataUrl(file));
    e.target.value = "";
  }

  return (
    <div className="card">
      <h3>Template</h3>
      <p className="muted">
        {isCustom ? "Using an uploaded template." : defaultLabel}
      </p>
      <div className="row">
        <button className="btn" onClick={() => input.current?.click()}>Upload template…</button>
        <button className="btn ghost" disabled={!isCustom} onClick={() => onTemplate(null)}>
          {resetLabel}
        </button>
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg" hidden onChange={onFile} />
    </div>
  );
}
