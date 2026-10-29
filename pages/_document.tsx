import { Html, Head, Main, NextScript } from "next/document";
import { PREFS_BOOT } from "@/lib/prefs";

export default function Document() {
  return (
    <Html lang="ar" dir="rtl" data-theme="dark">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_BOOT }} />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
