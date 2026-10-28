import type { NextApiRequest, NextApiResponse } from "next";
import { fetchMoroccanDay } from "@/lib/scores365Games";
import { inlineMatchImages } from "@/lib/inlineImage";
import { todayMA } from "@/lib/today";

// What fits on the matchday poster.
const MAX_MATCHES = 10;

// GET /api/fixtures?date=YYYY-MM-DD (defaults to today) — the matchday poster:
// every match of the day involving Moroccan football (Moroccan competitions,
// Moroccan clubs abroad, Morocco's national teams), from 365scores, ranked
// national team → Botola → clubs abroad → Throne Cup → Botola 2 → the rest,
// with crests and competition logos inlined for the export.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const raw = typeof req.query.date === "string" ? req.query.date : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : todayMA();
  try {
    const all = await fetchMoroccanDay(date);
    const matches = await inlineMatchImages(all.slice(0, MAX_MATCHES));
    // A busy day can hold more Moroccan matches than the poster: say so.
    const errors = all.length > MAX_MATCHES
      ? [`${all.length - MAX_MATCHES} مباريات أخرى لم تتسع للملصق (الأقل أولوية)`]
      : [];
    return res.status(200).json({ date, matches, total: all.length, errors, fetchedAt: new Date().toISOString(), stale: false });
  } catch (e) {
    return res.status(502).json({ date, matches: [], error: (e as Error).message });
  }
}
