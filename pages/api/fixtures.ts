import type { NextApiRequest, NextApiResponse } from "next";
import { fetchMatchday, MOROCCAN_FAME } from "@/lib/scores365Games";
import { inlineMatchImages } from "@/lib/inlineImage";
import { todayMA } from "@/lib/today";

// What fits on the matchday poster.
const MAX_MATCHES = 10;

// GET /api/fixtures?date=YYYY-MM-DD (defaults to today) — the matchday poster:
// Moroccan football first (national teams → Botola → Moroccan clubs abroad →
// Throne Cup → Botola 2 → the rest), then the day's biggest matches from the
// big European competitions, from 365scores, with crests and competition
// logos inlined for the export.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const raw = typeof req.query.date === "string" ? req.query.date : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : todayMA();
  try {
    const all = await fetchMatchday(date);
    const matches = await inlineMatchImages(all.slice(0, MAX_MATCHES));
    const moroccan = all.filter((m) => m.fame > MOROCCAN_FAME).length;
    // Big matches only fill what Moroccan football leaves; only Moroccan
    // matches that did not fit are worth a warning.
    const errors = moroccan > MAX_MATCHES
      ? [`${moroccan - MAX_MATCHES} مباريات مغربية أخرى لم تتسع للملصق`]
      : [];
    return res.status(200).json({
      date, matches, moroccanCount: Math.min(moroccan, MAX_MATCHES), errors,
      fetchedAt: new Date().toISOString(), stale: false,
    });
  } catch (e) {
    return res.status(502).json({ date, matches: [], error: (e as Error).message });
  }
}
