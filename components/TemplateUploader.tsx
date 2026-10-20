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
export default function TemplateUploader({ isCustom, onTemplate, defaultLabel = "يتم استخدام قالب شوف تي في الأصلي.", resetLabel = "استعادة القالب الأصلي" }: Props) {
  const input = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onTemplate(await fileToDataUrl(file));
    e.target.value = "";
  }

  return (
    <div className="card">
      <h3>القالب</h3>
      <p className="muted">
        {isCustom ? "يتم استخدام قالب مرفوع." : defaultLabel}
      </p>
      <div className="row">
        <button className="btn" onClick={() => input.current?.click()}>رفع قالب…</button>
        <button className="btn ghost" disabled={!isCustom} onClick={() => onTemplate(null)}>
          {resetLabel}
        </button>
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg" hidden onChange={onFile} />
    </div>
  );
}
