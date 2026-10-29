import type { NextApiRequest, NextApiResponse } from "next";
import { fetchRoundPool, fetchTotw, playedRounds, type RoundPool, type TotwPlayer } from "@/lib/totw";
import { inlineUrls } from "@/lib/inlineImage";
import { isStandingsLeague } from "@/config/standingsLeagues";
import { publicError } from "@/lib/publicError";

// GET /api/totw?competition=<id>[&key=<weekKey>]
//   365scores' own team of the round, or — where it has none — the rounds
//   that have been played, to pick a team for by hand.
// GET /api/totw?competition=<id>&round=<n>&pool=1[&faces=<id,id,…>]
//   Everyone who started that round, and their coaches: the players to pick
//   from. The list is names only — a Botola round is ~176 starters, and the
//   picker is text. `faces` returns just the chosen ones (12 at most) with
//   their faces and crests as data URLs, for the export.
const TTL_MS = 10 * 60 * 1000;
const MAX_FACES = 12;
const cache = new Map<string, { at: number; data: unknown }>();

// Expired entries go when a new one comes in, so an always-on server does not
// keep every round anyone ever opened.
function remember(key: string, data: unknown) {
  const now = Date.now();
  cache.forEach((v, k) => { if (now - v.at >= TTL_MS) cache.delete(k); });
  cache.set(key, { at: now, data });
}

// The raw pool is cached on its own: every face request reads it again.
async function poolOf(competition: number, round: number): Promise<RoundPool> {
  const key = `pool:${competition}:${round}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data as RoundPool;
  const pool = await fetchRoundPool(competition, round);
  remember(key, pool);
  return pool;
}

async function inline(players: TotwPlayer[]): Promise<TotwPlayer[]> {
  const urls = await inlineUrls(players.flatMap((p) => [p.photo, p.club?.logo ?? null]));
  const pick = (u: string | null) => (u ? urls.get(u) ?? null : null);
  return players.map((p) => ({ ...p, photo: pick(p.photo), club: p.club && { ...p.club, logo: pick(p.club.logo) } }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const competition = Number(req.query.competition);
  if (!isStandingsLeague(competition)) return res.status(400).json({ error: "Bad competition" });
  const key = typeof req.query.key === "string" ? req.query.key : "";
  if (key && !/^\d+(_\d+){4}$/.test(key)) return res.status(400).json({ error: "Bad round key" });
  const pool = req.query.pool === "1";
  const round = Number(req.query.round);
  if (pool && (!Number.isInteger(round) || round <= 0)) return res.status(400).json({ error: "Bad round" });

  const faces = typeof req.query.faces === "string" && req.query.faces
    ? req.query.faces.split(",").map(Number)
    : null;
  if (faces && (faces.length > MAX_FACES || faces.some((n) => !Number.isInteger(n) || n <= 0))) {
    return res.status(400).json({ error: "Bad faces" });
  }

  try {
    if (pool && faces) {
      const p = await poolOf(competition, round);
      const want = new Set(faces);
      return res.status(200).json({ players: await inline([...p.players, ...p.coaches].filter((x) => want.has(x.id))) });
    }
    if (pool) return res.status(200).json(await poolOf(competition, round));

    const cacheKey = `totw:${competition}:${key}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < TTL_MS) return res.status(200).json(hit.data);
    const totw = await fetchTotw(competition, key || undefined);
    let data: unknown;
    if (totw) {
      const [players, coach] = await Promise.all([inline(totw.players), totw.coach ? inline([totw.coach]) : Promise.resolve([])]);
      data = { totw: { ...totw, players, coach: coach[0] ?? null }, playedRounds: [] };
    } else {
      data = { totw: null, playedRounds: await playedRounds(competition) };
    }
    remember(cacheKey, data);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: publicError(e) });
  }
}
