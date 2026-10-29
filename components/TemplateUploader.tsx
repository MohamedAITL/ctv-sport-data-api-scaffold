import { useRef } from "react";
import { fileToDataUrl } from "@/lib/file";
import { useLang } from "@/lib/prefs";

interface Props {
  isCustom: boolean;
  onTemplate: (dataUrl: string | null) => void; // null -> reset to default
  defaultLabel?: string;
  resetLabel?: string;
}

// Upload a PNG/JPG template (stored in IndexedDB by the page) or reset to the
// bundled Chouf TV reference poster.
export default function TemplateUploader({ isCustom, onTemplate, defaultLabel = "يتم استخدام قالب شوف تي في الأصلي.", resetLabel = "استعادة القالب الأصلي" }: Props) {
  const { t } = useLang();
  const input = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onTemplate(await fileToDataUrl(file));
    e.target.value = "";
  }

  return (
    <div className="card">
      <h3>{t("القالب")}</h3>
      <p className="muted">
        {isCustom ? t("يتم استخدام قالب مرفوع.", "Using an uploaded template.") : t(defaultLabel)}
      </p>
      <div className="row">
        <button className="btn" onClick={() => input.current?.click()}>{t("رفع قالب…")}</button>
        <button className="btn ghost" disabled={!isCustom} onClick={() => onTemplate(null)}>
          {t(resetLabel)}
        </button>
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg" hidden onChange={onFile} />
    </div>
  );
}
