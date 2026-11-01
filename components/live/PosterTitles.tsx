import { useState } from "react";
import { useLang } from "@/lib/prefs";

/** Titles to post with a live poster. They stay Arabic, like the poster itself. */
export default function PosterTitles({ titles }: { titles: string[] }) {
  const { t } = useLang();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (title: string) => {
    try {
      await navigator.clipboard.writeText(title);
      setCopied(title);
      setTimeout(() => setCopied((c) => (c === title ? null : c)), 1500);
    } catch { /* clipboard blocked: the title can still be selected by hand */ }
  };

  return (
    <div className="card">
      <h3>{t("مولد العناوين", "Title generator")}</h3>
      <ul className="titlelist">
        {titles.map((title) => (
          <li key={title}>
            <span dir="rtl">{title}</span>
            <button type="button" className="copybtn" aria-label={`${t("نسخ", "Copy")}: ${title}`} onClick={() => copy(title)}>
              {copied === title ? t("تم النسخ", "Copied") : t("نسخ", "Copy")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
