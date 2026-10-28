import type { Match } from "@/types/fixtures";

// Fetch a remote image server-side and inline it as a data URL, so html-to-image
// can embed it in the client export without a tainted canvas / CORS error.
//
// The 365scores image CDN intermittently drops requests when a whole table is
// fetched at once (a 36-row UCL refresh lost ~2 crests per run), and a missing
// crest on a published poster is not acceptable — so each image gets a couple of
// retries, and the whole batch runs in bounded chunks rather than one burst.

const ATTEMPTS = 3;
const CHUNK = 8;
// The CDN sometimes stalls a single image for 30s+; without a deadline one
// stalled photo holds its whole chunk, and the poster, hostage.
const TIMEOUT_MS = 6000;

export async function toDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
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

// Badges and the competition logo are inlined as data URLs so html-to-image can
// embed them in the export without tainting the canvas.
export async function inlineMatchImages(matches: Match[]): Promise<Match[]> {
  const logos = await inlineUrls(matches.flatMap((m) => [m.home.badge, m.away.badge, m.leagueLogo]));
  // Some competitions have no "light" logo (the one drawn for dark posters) —
  // Botola 2 among them — but do have the normal one: use that instead.
  const missing = Array.from(logos.entries()).filter(([u, d]) => !d && u.includes("/Competitions/light/")).map(([u]) => u);
  if (missing.length) {
    const plain = await inlineUrls(missing.map((u) => u.replace("/Competitions/light/", "/Competitions/")));
    for (const u of missing) logos.set(u, plain.get(u.replace("/Competitions/light/", "/Competitions/")) ?? null);
  }
  const pick = (u: string | null) => (u ? logos.get(u) ?? null : null);
  return matches.map((m) => ({
    ...m,
    leagueLogo: pick(m.leagueLogo),
    home: { ...m.home, badge: pick(m.home.badge) },
    away: { ...m.away, badge: pick(m.away.badge) },
  }));
}
