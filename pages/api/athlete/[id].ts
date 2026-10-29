import type { NextApiRequest, NextApiResponse } from "next";
import { fetchAthlete } from "@/lib/live365";
import { publicError } from "@/lib/publicError";

// GET /api/athlete/<athleteId> — bio only; the match payload already carries
// the player's stats for the game itself.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "Bad athlete id" });
  try {
    const bio = await fetchAthlete(id);
    if (!bio) return res.status(404).json({ error: "Athlete not found" });
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).json({ bio });
  } catch (e) {
    return res.status(502).json({ error: publicError(e) });
  }
}
