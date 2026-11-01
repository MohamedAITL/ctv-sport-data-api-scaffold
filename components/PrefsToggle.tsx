import Icon from "./Icon";
import { useLang, usePrefs } from "@/lib/prefs";
import type { MouseEvent } from "react";

const centre = (e: MouseEvent<HTMLElement>) => { const r = e.currentTarget.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

/** Design, light/dark and Arabic/English, side by side wherever the app has a header. */
export default function PrefsToggle() {
  const { lang, theme, design, setLang, setTheme, setDesign } = usePrefs();
  const { t } = useLang();
  const themeLabel = theme === "light" ? t("الوضع الداكن", "Dark mode") : t("الوضع الفاتح", "Light mode");
  const designLabel = design === "studio" ? t("التصميم السابق", "Previous design") : t("التصميم الجديد", "New design");
  return (
    <div className="prefs">
      <button type="button" className="prefs-btn" aria-label={designLabel} title={designLabel} onClick={(e) => setDesign(design === "studio" ? "classic" : "studio", centre(e))}>
        <Icon name="design" /><span className="glyph">{design === "studio" ? "◧" : "◨"}</span>
      </button>
      <button type="button" className="prefs-btn" aria-label={themeLabel} title={themeLabel} onClick={(e) => setTheme(theme === "light" ? "dark" : "light", centre(e))}>
        <Icon name={theme === "light" ? "moon" : "sun"} /><span className="glyph">{theme === "light" ? "☾" : "☀"}</span>
      </button>
      <button
        type="button" className="prefs-btn" lang={lang === "en" ? "ar" : "en"}
        aria-label={lang === "en" ? "العربية" : "English"}
        onClick={() => setLang(lang === "en" ? "ar" : "en")}
      >
        {lang === "en" ? "ع" : "EN"}
      </button>
    </div>
  );
}
