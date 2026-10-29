import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EN } from "./i18n/en";

export type Lang = "ar" | "en";
export type Theme = "dark" | "light";

export const LANG_KEY = "chouf.lang";
export const THEME_KEY = "chouf.theme";

/**
 * Runs before the first paint (inlined in _document): the saved theme — or the
 * system's — and the language's direction, so neither flashes on load.
 */
export const PREFS_BOOT = `try{var d=document.documentElement,t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";d.dataset.theme=t;var l=localStorage.getItem("${LANG_KEY}")==="en"?"en":"ar";d.lang=l;d.dir=l==="en"?"ltr":"rtl"}catch(e){}`;

interface Prefs { lang: Lang; theme: Theme; setLang: (l: Lang) => void; setTheme: (t: Theme) => void }
const Ctx = createContext<Prefs>({ lang: "ar", theme: "dark", setLang: () => {}, setTheme: () => {} });

export function PrefsProvider({ children }: { children: ReactNode }) {
  // The pages are pre-rendered in Arabic; the saved language is adopted on mount.
  const [lang, setLangState] = useState<Lang>("ar");
  const [theme, setThemeState] = useState<Theme>("dark");
  useEffect(() => {
    setLangState(document.documentElement.lang === "en" ? "en" : "ar");
    setThemeState(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(THEME_KEY, t); } catch { /* private mode */ }
  }, []);
  // A switch reloads, so every page re-renders in the new language and direction.
  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem(LANG_KEY, l); } catch { /* private mode */ }
    location.reload();
  }, []);

  const value = useMemo(() => ({ lang, theme, setLang, setTheme }), [lang, theme, setLang, setTheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const usePrefs = () => useContext(Ctx);

/** Translate a UI string, given in Arabic; `en` inline, or from the shared dictionary. */
export type T = (ar: string, en?: string) => string;
export const translate = (lang: Lang): T => (ar, en) => (lang === "en" ? en ?? EN[ar] ?? ar : ar);

export function useLang() {
  const { lang } = usePrefs();
  return useMemo(() => ({
    lang,
    t: translate(lang),
    dir: (lang === "en" ? "ltr" : "rtl") as "ltr" | "rtl",
    locale: lang === "en" ? "en-GB" : "ar-MA",
  }), [lang]);
}
