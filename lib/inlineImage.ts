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

// Inline `urlOf(item)` for every item, in chunks, returning a new array.
export async function inlineImages<T>(
  items: T[],
  urlOf: (item: T) => string | null,
  withUrl: (item: T, dataUrl: string | null) => T
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < items.length; i += CHUNK) {
    const slice = items.slice(i, i + CHUNK);
    out.push(...(await Promise.all(slice.map(async (it) => withUrl(it, await toDataUrl(urlOf(it)))))));
  }
  return out;
}
