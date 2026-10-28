import type { NextApiRequest, NextApiResponse } from "next";
import { fetch365Games, roundsOf } from "@/lib/scores365Games";
import { inlineMatchImages } from "@/lib/inlineImage";
import { ROUND_LEAGUES, BOTOLA_LEAGUE, leagueById } from "@/config/standingsLeagues";

// GET /api/round?competition=<365scores id> — every game 365scores currently
// exposes for the league, with the rounds present. An empty/short list means the
// schedule isn't published yet, which the page reports rather than treating as
// an error.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = Number(req.query.competition);
  const competition = ROUND_LEAGUES.includes(q) ? q : BOTOLA_LEAGUE;
  try {
    const { matches, season } = await fetch365Games(competition);
    const withLogos = await inlineMatchImages(matches);
    return res.status(200).json({
      competition,
      league: leagueById(competition)?.ar ?? "",
      matches: withLogos,
      rounds: roundsOf(withLogos),
      season,
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(502).json({ error: (e as Error).message, matches: [], rounds: [] });
  }
}
