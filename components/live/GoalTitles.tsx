import { useState } from "react";
import { useLang } from "@/lib/prefs";

/** Titles to post with a goal poster. They stay Arabic, like the poster itself. */
export default function GoalTitles({ titles }: { titles: string[] }) {
  const { t } = useLang();
  const [copied, setCopied] = useState<number | null>(null);

  const copy = async (title: string, i: number) => {
    try {
      await navigator.clipboard.writeText(title);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    } catch { /* clipboard blocked: the title can still be selected by hand */ }
  };

  return (
    <div className="card">
      <h3>{t("عناوين للنشر", "Titles to post")}</h3>
      <ul className="titlelist">
        {titles.map((title, i) => (
          <li key={title}>
            <span dir="rtl">{title}</span>
            <button type="button" className="copybtn" aria-label={`${t("نسخ", "Copy")}: ${title}`} onClick={() => copy(title, i)}>
              {copied === i ? t("تم النسخ", "Copied") : t("نسخ", "Copy")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
