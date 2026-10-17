import "@/styles/globals.css";
// Self-hosted Arabic font — bundled so html-to-image can embed it reliably
// (no Google-Fonts-over-link race at capture time).
import "@fontsource/cairo/400.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";
import "@fontsource/cairo/900.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
