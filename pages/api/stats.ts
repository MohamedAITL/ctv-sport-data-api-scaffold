import type { NextApiRequest, NextApiResponse } from "next";
import { fetch365Stats, type StatCategory } from "@/lib/scores365Stats";
import { inlineImages } from "@/lib/inlineImage";
import { BOTOLA_LEAGUE, isStandingsLeague, leagueById } from "@/config/standingsLeagues";

// Only the rows a poster can show are worth inlining — fetching every photo for
// all 16 categories would be hundreds of images per refresh.
const MAX_ROWS = 20;

async function inlineCategory(c: StatCategory): Promise<StatCategory> {
  const rows = c.rows.slice(0, MAX_ROWS);
  const withMain = await inlineImages(rows, (r) => r.image, (r, image) => ({ ...r, image }));
  const withClub = await inlineImages(withMain, (r) => r.clubImage, (r, clubImage) => ({ ...r, clubImage }));
  return { ...c, rows: withClub };
}

// GET /api/stats?competition=<id> — all stat leaderboards for the league, with
// images inlined as data URLs so the PNG export can embed them.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = Number(req.query.competition);
  const competition = isStandingsLeague(q) ? q : BOTOLA_LEAGUE;
  try {
    const cats = await fetch365Stats(competition);
    const categories = await Promise.all(cats.map(inlineCategory));
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
