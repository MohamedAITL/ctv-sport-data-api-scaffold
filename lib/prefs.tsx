import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EN } from "./i18n/en";
import { transition } from "./motion";

export type Lang = "ar" | "en";
export type Theme = "dark" | "light";
export type Design = "studio" | "classic";

export const LANG_KEY = "chouf.lang";
export const THEME_KEY = "chouf.theme";
export const DESIGN_KEY = "chouf.design";
export const RAIL_KEY = "chouf.rail";

/** The tab a path belongs to; the Studio design gives each its own colour. */
export const sectionOf = (path: string) => /^\/(round|matchday|stats|news|live)/.exec(path)?.[1] ?? "standings";

/**
 * Runs before the first paint (inlined in _document): the saved design, the
 * theme (Studio opens dark; classic follows the system), the language's
 * direction and the tab's colour, so none of them flashes on load.
 */
export const PREFS_BOOT = `try{var d=document.documentElement,g=localStorage.getItem("${DESIGN_KEY}")==="classic"?"classic":"studio",m=/^\\/(round|matchday|stats|news|live)/.exec(location.pathname),t=localStorage.getItem("${THEME_KEY}");d.dataset.design=g;d.dataset.section=m?m[1]:"standings";d.dataset.rail=localStorage.getItem("${RAIL_KEY}")==="closed"?"closed":"open";if(t!=="light"&&t!=="dark")t=g==="classic"&&matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";d.dataset.theme=t;var l=localStorage.getItem("${LANG_KEY}")==="en"?"en":"ar";d.lang=l;d.dir=l==="en"?"ltr":"rtl"}catch(e){}`;

type From = { x: number; y: number };
interface Prefs { lang: Lang; theme: Theme; design: Design; setLang: (l: Lang) => void; setTheme: (t: Theme, from?: From) => void; setDesign: (d: Design, from?: From) => void }
const Ctx = createContext<Prefs>({ lang: "ar", theme: "dark", design: "studio", setLang: () => {}, setTheme: () => {}, setDesign: () => {} });

export function PrefsProvider({ children }: { children: ReactNode }) {
  // The pages are pre-rendered in Arabic; the saved language is adopted on mount.
  const [lang, setLangState] = useState<Lang>("ar");
  const [theme, setThemeState] = useState<Theme>("dark");
  const [design, setDesignState] = useState<Design>("studio");
  useEffect(() => {
    setLangState(document.documentElement.lang === "en" ? "en" : "ar");
    setThemeState(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    setDesignState(document.documentElement.dataset.design === "classic" ? "classic" : "studio");
  }, []);

  // The page hydrates in Arabic, and Chrome keeps the text direction it worked
  // out for nodes that did not change, so "(" and ")" beside a translated label
  // stayed mirrored. Flipping dir and back, unpainted, makes it work it out again.
  useEffect(() => {
    if (lang !== "en") return;
    const root = document.documentElement;
    root.dir = "rtl";
    void root.offsetHeight;
    root.dir = "ltr";
  }, [lang]);

  const setTheme = useCallback((t: Theme, from?: From) => {
    setThemeState(t);
    try { localStorage.setItem(THEME_KEY, t); } catch { /* private mode */ }
    transition("theme", () => { document.documentElement.dataset.theme = t; }, from);
  }, []);
  const setDesign = useCallback((g: Design, from?: From) => {
    setDesignState(g);
    try { localStorage.setItem(DESIGN_KEY, g); } catch { /* private mode */ }
    transition("theme", () => { document.documentElement.dataset.design = g; }, from);
  }, []);
  // A switch reloads, so every page re-renders in the new language and direction.
  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem(LANG_KEY, l); } catch { /* private mode */ }
    location.reload();
  }, []);

  const value = useMemo(() => ({ lang, theme, design, setLang, setTheme, setDesign }), [lang, theme, design, setLang, setTheme, setDesign]);
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
