import type { NextApiRequest, NextApiResponse } from "next";
import { fetchPreviousMatches } from "@/lib/live365";
import { fetch365Standings } from "@/lib/scores365";
import type { PreviousMatches } from "@/types/live";
import type { TeamRow } from "@/types/standings";

// GET /api/live/previous?home=<id>&away=<id>[&competition=<id>]
// Loaded only when the tab is opened, and cached: past results and a league
// table do not change between refreshes, so the kiosk's 15s poll must not drag
// them along.
const TTL_MS = 10 * 60 * 1000;
interface Payload { previous: PreviousMatches; table: TeamRow[] }
const cache = new Map<string, { at: number; data: Payload }>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const home = Number(req.query.home);
  const away = Number(req.query.away);
  if (!Number.isFinite(home) || !Number.isFinite(away) || home <= 0 || away <= 0) {
    return res.status(400).json({ error: "Bad competitor ids" });
  }
  const competition = Number(req.query.competition);
  const key = `${home}-${away}-${competition || 0}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return res.status(200).json(hit.data);
  try {
    // A cup has no table and a dead table must not cost the meetings.
    const [prev, table] = await Promise.allSettled([
      fetchPreviousMatches(home, away),
      Number.isFinite(competition) && competition > 0
        ? fetch365Standings(competition).then((s) => s.rows)
        : Promise.resolve([] as TeamRow[]),
    ]);
    if (prev.status !== "fulfilled") throw prev.reason;
    const data: Payload = {
      previous: prev.value,
      table: table.status === "fulfilled" ? table.value : [],
    };
    cache.set(key, { at: Date.now(), data });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: (e as Error).message });
  }
}
