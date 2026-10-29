import { useLang, usePrefs } from "@/lib/prefs";

/** Light/dark and Arabic/English, side by side wherever the app has a header. */
export default function PrefsToggle() {
  const { lang, theme, setLang, setTheme } = usePrefs();
  const { t } = useLang();
  return (
    <div className="prefs">
      <button
        type="button" className="prefs-btn"
        aria-label={theme === "light" ? t("الوضع الداكن", "Dark mode") : t("الوضع الفاتح", "Light mode")}
        title={theme === "light" ? t("الوضع الداكن", "Dark mode") : t("الوضع الفاتح", "Light mode")}
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        {theme === "light" ? "☾" : "☀"}
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
