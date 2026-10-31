import "@/styles/globals.css";
import "@/styles/studio.css";
// The app's own typeface: one variable file covers 300-900 and ships an Arabic
// subset, so the UI gets the whole weight range for fewer requests than the
// four static Cairo faces it replaces.
import "@fontsource-variable/rubik";
// Cairo stays loaded because every poster hardcodes it: the exported PNGs must
// not change when the app around them does. It is no longer the UI font.
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";
import "@fontsource/cairo/900.css";
import "@fontsource-variable/alexandria";
import { useEffect } from "react";
import { useRouter } from "next/router";
import type { AppProps } from "next/app";
import { PrefsProvider, sectionOf } from "@/lib/prefs";

export default function App({ Component, pageProps }: AppProps) {
  const { pathname } = useRouter();
  useEffect(() => { document.documentElement.dataset.section = sectionOf(pathname); }, [pathname]);
  return (
    <PrefsProvider>
      <Component {...pageProps} />
    </PrefsProvider>
  );
}
