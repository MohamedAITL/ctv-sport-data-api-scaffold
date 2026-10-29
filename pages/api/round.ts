import type { NextApiRequest, NextApiResponse } from "next";
import { fetch365Games, roundKey, roundsWithLabels, type GamesResult } from "@/lib/scores365Games";
import { inlineMatchImages } from "@/lib/inlineImage";
import { BOTOLA_LEAGUE, isStandingsLeague, leagueById } from "@/config/standingsLeagues";
import { publicError } from "@/lib/publicError";

// A season is fetched once and reused while the page inlines the round it
// shows: a cup can field a hundred clubs, and inlining every crest of the
// season took longer than a function may run.
const TTL_MS = 60 * 1000;
const cache = new Map<number, { at: number; data: GamesResult }>();

async function seasonOf(competition: number): Promise<GamesResult> {
  const hit = cache.get(competition);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const data = await fetch365Games(competition);
  const now = Date.now();
  cache.forEach((v, k) => { if (now - v.at >= TTL_MS) cache.delete(k); });
  cache.set(competition, { at: now, data });
  return data;
}

// GET /api/round?competition=<365scores id>
//   Every game 365scores currently exposes for the competition (any followed
//   one), with its rounds — or, for a cup, its stages — labelled. Crests as
//   URLs: this is the list to pick a round from. An empty list means the
//   schedule isn't published yet, which the page reports rather than treating
//   as an error.
// GET /api/round?competition=<id>&round=<key>
//   That round's games, crests inlined for the export.
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = Number(req.query.competition);
  const competition = isStandingsLeague(q) ? q : BOTOLA_LEAGUE;
  const rawRound = typeof req.query.round === "string" ? req.query.round : null;
  if (rawRound !== null && !/^-?\d+$/.test(rawRound)) return res.status(400).json({ error: "Bad round", matches: [] });
  try {
    const { matches, season } = await seasonOf(competition);
    if (rawRound !== null) {
      const round = Number(rawRound);
      return res.status(200).json({ competition, round, matches: await inlineMatchImages(matches.filter((m) => roundKey(m) === round)) });
    }
    return res.status(200).json({
      competition,
      league: leagueById(competition)?.ar ?? "",
      matches,
      rounds: roundsWithLabels(matches),
      season,
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(502).json({ error: publicError(e), matches: [], rounds: [] });
  }
}

export default handler;
