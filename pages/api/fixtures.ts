import type { NextApiRequest, NextApiResponse } from "next";
import { fetchMatchday, MOROCCAN_FAME } from "@/lib/scores365Games";
import { inlineMatchImages } from "@/lib/inlineImage";
import { todayMA } from "@/lib/today";
import type { Match } from "@/types/fixtures";
import { publicError } from "@/lib/publicError";

// The day's list is fetched once and reused while the page inlines the
// matches it picks, one request per change of selection.
const TTL_MS = 60 * 1000;
const MAX_IDS = 80;
const cache = new Map<string, { at: number; matches: Match[] }>();

async function day(date: string): Promise<Match[]> {
  const hit = cache.get(date);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.matches;
  const matches = await fetchMatchday(date);
  const now = Date.now();
  cache.forEach((v, k) => { if (now - v.at >= TTL_MS) cache.delete(k); });
  cache.set(date, { at: now, matches });
  return matches;
}

// GET /api/fixtures?date=YYYY-MM-DD (defaults to today)
//   Every football match of the day from 365scores, ranked Moroccan football
//   first (see fetchMatchday). Crests and logos as URLs: this is the list to
//   pick from.
// GET /api/fixtures?date=YYYY-MM-DD&ids=<id,id,…>
//   Just those matches, crests and competition logos inlined for the export.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const raw = typeof req.query.date === "string" ? req.query.date : "";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : todayMA();
  const ids = typeof req.query.ids === "string" && req.query.ids ? req.query.ids.split(",") : null;
  if (ids && (ids.length > MAX_IDS || ids.some((id) => !/^\d+$/.test(id)))) {
    return res.status(400).json({ error: "Bad ids" });
  }
  try {
    const all = await day(date);
    if (ids) {
      const want = new Set(ids);
      return res.status(200).json({ date, matches: await inlineMatchImages(all.filter((m) => want.has(m.id))) });
    }
    const moroccanCount = all.filter((m) => m.fame > MOROCCAN_FAME).length;
    return res.status(200).json({ date, matches: all, moroccanCount, errors: [], fetchedAt: new Date().toISOString(), stale: false });
  } catch (e) {
    return res.status(502).json({ date, matches: [], error: publicError(e) });
  }
}
