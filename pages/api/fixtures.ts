import type { NextApiRequest, NextApiResponse } from "next";
import { fetchMatchday, MOROCCAN_FAME } from "@/lib/scores365Games";
import { inlineMatchImages } from "@/lib/inlineImage";
import { todayMA } from "@/lib/today";

// GET /api/fixtures?date=YYYY-MM-DD (defaults to today) — every candidate for
// the matchday poster, ranked: Moroccan football first (national teams →
// Botola → Moroccan clubs abroad → Throne Cup → Botola 2 → the rest), then
// all the day's matches from the big European competitions by club fame. The
// page picks which go on the poster; crests and competition logos come
// inlined for the export.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const raw = typeof req.query.date === "string" ? req.query.date : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : todayMA();
  try {
    const matches = await inlineMatchImages(await fetchMatchday(date));
    const moroccanCount = matches.filter((m) => m.fame > MOROCCAN_FAME).length;
    return res.status(200).json({ date, matches, moroccanCount, errors: [], fetchedAt: new Date().toISOString(), stale: false });
  } catch (e) {
    return res.status(502).json({ date, matches: [], error: (e as Error).message });
  }
}
