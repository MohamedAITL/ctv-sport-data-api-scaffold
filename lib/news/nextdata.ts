// Several publishers here have no feed but are Next.js sites that ship their own
// data in __NEXT_DATA__. That is publisher-rendered data, not scraped markup, so
// it is far steadier than parsing the HTML — and it is the same two lines for
// each of them.
export const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

export async function nextData(url: string, label: string): Promise<Record<string, unknown>> {
  const r = await fetch(url, { headers: { "User-Agent": BROWSER_UA, Accept: "text/html" } });
  if (!r.ok) throw new Error(`${label} ${r.status}`);
  const html = await r.text();
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error(`${label}: no __NEXT_DATA__`);
  return JSON.parse(m[1]) as Record<string, unknown>;
}

export const pageProps = (d: Record<string, unknown>): Record<string, unknown> =>
  ((d.props as Record<string, unknown> | undefined)?.pageProps as Record<string, unknown>) ?? {};
