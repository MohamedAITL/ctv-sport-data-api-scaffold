import type { NextApiRequest, NextApiResponse } from "next";
import { fetchLiveMatches } from "@/lib/live365";
import type { LiveMatch } from "@/types/live";

// The source refreshes every ~5s; a short cache keeps an always-on wall screen
// (or several) from hammering it on every poll. `?refresh=1` bypasses it.
const TTL_MS = 10_000;
let cache: { at: number; items: LiveMatch[] } | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const refresh = req.query.refresh === "1";
  try {
    if (!refresh && cache && Date.now() - cache.at < TTL_MS) {
      return res.status(200).json({ matches: cache.items, fetchedAt: new Date(cache.at).toISOString(), cached: true });
    }
    const items = await fetchLiveMatches();
    cache = { at: Date.now(), items };
    return res.status(200).json({ matches: items, fetchedAt: new Date().toISOString(), cached: false });
  } catch (e) {
    // Serve the last good list rather than blanking a live screen.
    if (cache) {
      return res.status(200).json({
        matches: cache.items, fetchedAt: new Date(cache.at).toISOString(),
        stale: true, error: (e as Error).message,
      });
    }
    return res.status(502).json({ matches: [], error: (e as Error).message });
  }
}
