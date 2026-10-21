import type { NextApiRequest, NextApiResponse } from "next";
import { fetchLiveMatches } from "@/lib/live365";
import type { LiveMatch } from "@/types/live";
import { todayMA } from "@/lib/today";

// Today refreshes every ~5s upstream, so a short cache keeps an always-on wall
// screen from hammering it. A past day never changes, so it is cached for long.
const TTL_TODAY_MS = 10_000;
const TTL_PAST_MS = 60 * 60_000;
const cache = new Map<string, { at: number; items: LiveMatch[] }>();

const todayIso = () => todayMA();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const refresh = req.query.refresh === "1";
  const raw = typeof req.query.date === "string" ? req.query.date : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
  const isToday = !date || date === todayIso();
  const key = date || "today";
  const ttl = isToday ? TTL_TODAY_MS : TTL_PAST_MS;
  const hit = cache.get(key);

  try {
    if (!refresh && hit && Date.now() - hit.at < ttl) {
      return res.status(200).json({ matches: hit.items, date: key, fetchedAt: new Date(hit.at).toISOString(), cached: true });
    }
    const items = await fetchLiveMatches(isToday ? undefined : date);
    cache.set(key, { at: Date.now(), items });
    return res.status(200).json({ matches: items, date: key, fetchedAt: new Date().toISOString(), cached: false });
  } catch (e) {
    // Serve the last good list rather than blanking a live screen.
    if (hit) {
      return res.status(200).json({
        matches: hit.items, date: key, fetchedAt: new Date(hit.at).toISOString(),
        stale: true, error: (e as Error).message,
      });
    }
    return res.status(502).json({ matches: [], date: key, error: (e as Error).message });
  }
}
