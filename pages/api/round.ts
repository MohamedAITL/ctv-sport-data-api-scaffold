import type { NextApiRequest, NextApiResponse } from "next";
import { fetch365Games, roundsOf } from "@/lib/scores365Games";
import { inlineImages } from "@/lib/inlineImage";
import { ROUND_LEAGUES, BOTOLA_LEAGUE, leagueById } from "@/config/standingsLeagues";
import type { Match } from "@/types/fixtures";

// Badges and the competition logo are inlined as data URLs so html-to-image can
// embed them in the export without tainting the canvas.
async function inlineBadges(matches: Match[]): Promise<Match[]> {
  const logos = new Map<string, string | null>();
  const urls = Array.from(
    new Set(
      matches.flatMap((m) => [m.home.badge, m.away.badge, m.leagueLogo].filter(Boolean) as string[])
    )
  );
  const resolved = await inlineImages(
    urls.map((u) => ({ u, d: null as string | null })),
    (x) => x.u,
    (x, d) => ({ ...x, d })
  );
  for (const r of resolved) logos.set(r.u, r.d);
  const pick = (u: string | null) => (u ? logos.get(u) ?? null : null);
  return matches.map((m) => ({
    ...m,
    leagueLogo: pick(m.leagueLogo),
    home: { ...m.home, badge: pick(m.home.badge) },
    away: { ...m.away, badge: pick(m.away.badge) },
  }));
}

// GET /api/round?competition=<365scores id> — every game 365scores currently
// exposes for the league, with the rounds present. An empty/short list means the
// schedule isn't published yet, which the page reports rather than treating as
// an error.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = Number(req.query.competition);
  const competition = ROUND_LEAGUES.includes(q) ? q : BOTOLA_LEAGUE;
  try {
    const { matches, season } = await fetch365Games(competition);
    const withLogos = await inlineBadges(matches);
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
