import "@/styles/globals.css";
import "@/styles/studio.css";
// The app's typeface, and the posters' (config/posterFont.ts): one variable file
// covers weights 300-900 and ships an Arabic subset.
import "@fontsource-variable/rubik";
import { useEffect } from "react";
import { useRouter } from "next/router";
import type { AppProps } from "next/app";
import { PrefsProvider, sectionOf } from "@/lib/prefs";
import { canTransition, transition } from "@/lib/motion";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { pathname } = router;
  useEffect(() => { document.documentElement.dataset.section = sectionOf(pathname); }, [pathname]);

  // Ahead of next/link, so the old page is captured before it changes. Anything
  // but a plain click on an internal link is left to the browser.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !canTransition()) return;
      const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target || a.hasAttribute("download") || a.origin !== location.origin || a.pathname === location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      transition("route", async () => {
        document.documentElement.dataset.section = sectionOf(a.pathname);
        await router.push(a.pathname + a.search + a.hash);
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);
  return (
    <PrefsProvider>
      <Component {...pageProps} />
    </PrefsProvider>
  );
}
