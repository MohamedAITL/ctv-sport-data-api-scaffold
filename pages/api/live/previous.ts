import type { NextApiRequest, NextApiResponse } from "next";
import { fetchPreviousMatches } from "@/lib/live365";
import type { PreviousMatches } from "@/types/live";

// GET /api/live/previous?home=<id>&away=<id>
// Loaded only when the tab is opened, and cached: past results do not change
// between refreshes, so the kiosk's 15s poll must not drag them along.
const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; data: PreviousMatches }>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const home = Number(req.query.home);
  const away = Number(req.query.away);
  if (!Number.isFinite(home) || !Number.isFinite(away) || home <= 0 || away <= 0) {
    return res.status(400).json({ error: "Bad competitor ids" });
  }
  const key = `${home}-${away}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return res.status(200).json({ previous: hit.data });
  try {
    const data = await fetchPreviousMatches(home, away);
    cache.set(key, { at: Date.now(), data });
    return res.status(200).json({ previous: data });
  } catch (e) {
    return res.status(502).json({ error: (e as Error).message });
  }
}
