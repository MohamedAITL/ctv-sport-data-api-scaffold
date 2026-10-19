import type { NextApiRequest, NextApiResponse } from "next";
import { fetchLiveDetail } from "@/lib/live365";

// GET /api/live/<gameId>?matchup=<home-away-competition>
// The matchup id is what unlocks lineups, events and members upstream.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  const matchup = String(req.query.matchup ?? "");
  if (!Number.isFinite(id) || !/^\d+-\d+-\d+$/.test(matchup)) {
    return res.status(400).json({ error: "Bad game id or matchup id" });
  }
  try {
    const detail = await fetchLiveDetail(id, matchup);
    if (!detail) return res.status(404).json({ error: "Match not found" });
    return res.status(200).json({ detail, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(502).json({ error: (e as Error).message });
  }
}
