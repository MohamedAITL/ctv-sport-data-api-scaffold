import type { NextApiRequest, NextApiResponse } from "next";
import { fetch365Stats, type StatCategory } from "@/lib/scores365Stats";
import { inlineUrls } from "@/lib/inlineImage";
import { BOTOLA_LEAGUE, isStandingsLeague, leagueById } from "@/config/standingsLeagues";

// Only the rows a poster can show are worth inlining — fetching every photo for
// all 16 categories would be hundreds of images per refresh.
const MAX_ROWS = 20;

// One pass over every image any shown row needs. The same scorer appears in
// goals, shots and minutes, and every club's crest on all its players' rows:
// ~170 distinct images behind ~640 references.
async function inlineAll(cats: StatCategory[]): Promise<StatCategory[]> {
  const shown = cats.map((c) => ({ ...c, rows: c.rows.slice(0, MAX_ROWS) }));
  const inlined = await inlineUrls(shown.flatMap((c) => c.rows.flatMap((r) => [r.image, r.clubImage])));
  const pick = (u: string | null) => (u ? inlined.get(u) ?? null : null);
  return shown.map((c) => ({ ...c, rows: c.rows.map((r) => ({ ...r, image: pick(r.image), clubImage: pick(r.clubImage) })) }));
}

// GET /api/stats?competition=<id> — all stat leaderboards for the league, with
// images inlined as data URLs so the PNG export can embed them.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = Number(req.query.competition);
  const competition = isStandingsLeague(q) ? q : BOTOLA_LEAGUE;
  try {
    const cats = await fetch365Stats(competition);
    const categories = await inlineAll(cats);
    return res.status(200).json({
      competition,
      league: leagueById(competition)?.ar ?? "",
      categories,
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(502).json({ error: (e as Error).message, categories: [] });
  }
}
