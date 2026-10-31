import Icon from "./Icon";
import { useLang, usePrefs } from "@/lib/prefs";

/** Design, light/dark and Arabic/English, side by side wherever the app has a header. */
export default function PrefsToggle() {
  const { lang, theme, design, setLang, setTheme, setDesign } = usePrefs();
  const { t } = useLang();
  const themeLabel = theme === "light" ? t("الوضع الداكن", "Dark mode") : t("الوضع الفاتح", "Light mode");
  const designLabel = design === "studio" ? t("التصميم السابق", "Previous design") : t("التصميم الجديد", "New design");
  return (
    <div className="prefs">
      <button type="button" className="prefs-btn" aria-label={designLabel} title={designLabel} onClick={() => setDesign(design === "studio" ? "classic" : "studio")}>
        <Icon name="design" /><span className="glyph">{design === "studio" ? "◧" : "◨"}</span>
      </button>
      <button type="button" className="prefs-btn" aria-label={themeLabel} title={themeLabel} onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
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
