// Fetch a remote image server-side and inline it as a data URL, so html-to-image
// can embed it in the client export without a tainted canvas / CORS error.
//
// The 365scores image CDN intermittently drops requests when a whole table is
// fetched at once (a 36-row UCL refresh lost ~2 crests per run), and a missing
// crest on a published poster is not acceptable — so each image gets a couple of
// retries, and the whole batch runs in bounded chunks rather than one burst.

const ATTEMPTS = 3;
const CHUNK = 8;

export async function toDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        const ct = r.headers.get("content-type") || "image/png";
        const buf = Buffer.from(await r.arrayBuffer());
        return `data:${ct};base64,${buf.toString("base64")}`;
      }
      // 404 is a genuinely missing image; retrying cannot help.
      if (r.status === 404) return null;
    } catch {
      /* network blip — fall through to retry */
    }
    if (attempt < ATTEMPTS) await new Promise((r) => setTimeout(r, 120 * attempt));
  }
  return null;
}

// Every distinct URL fetched once, in chunks. A leaderboard repeats each club's
// crest on every row of every category, and the CDN should be asked for it
// once, not three hundred times.
export async function inlineUrls(urls: Array<string | null>): Promise<Map<string, string | null>> {
  const unique = Array.from(new Set(urls.filter((u): u is string => Boolean(u))));
  const out = new Map<string, string | null>();
  for (let i = 0; i < unique.length; i += CHUNK) {
    const slice = unique.slice(i, i + CHUNK);
    const got = await Promise.all(slice.map(toDataUrl));
    slice.forEach((u, j) => out.set(u, got[j]));
  }
  return out;
}

// Inline `urlOf(item)` for every item, returning a new array.
export async function inlineImages<T>(
  items: T[],
  urlOf: (item: T) => string | null,
  withUrl: (item: T, dataUrl: string | null) => T
): Promise<T[]> {
  const inlined = await inlineUrls(items.map(urlOf));
  return items.map((it) => {
    const u = urlOf(it);
    return withUrl(it, u ? inlined.get(u) ?? null : null);
  });
}
