import type { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "fs";
import path from "path";
import { goalFetch, hasApiKey } from "@/lib/goalApi";
import { normalizeFixtures, selectMatchday } from "@/lib/fixtures";
import { FEATURED_LEAGUES } from "@/config/featuredLeagues";
import type { RawFixturesResponse, Match } from "@/types/fixtures";
import seedNames from "@/data/botolaTeams.json";

const CACHE = path.join(process.cwd(), "data", "matchday.json");

function nameMap(): Record<string, string> {
  const { _comment, ...rest } = seedNames as Record<string, string>;
  void _comment;
  return rest;
}

async function toDataUrl(url: string | null, cache: Map<string, string | null>): Promise<string | null> {
  if (!url) return null;
  if (cache.has(url)) return cache.get(url)!;
  let out: string | null = null;
  try {
    const r = await fetch(url);
    if (r.ok) {
      const ct = r.headers.get("content-type") || "image/png";
      out = `data:${ct};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
    }
  } catch {
    /* leave null -> fallback */
  }
  cache.set(url, out);
  return out;
}

async function readCache(): Promise<{ date: string; matches: Match[]; fetchedAt: string } | null> {
  try {
    return JSON.parse(await fs.readFile(CACHE, "utf8"));
  } catch {
    return null;
  }
}

// GET /api/fixtures?date=YYYY-MM-DD (defaults to today). Fetches each featured
// league's fixtures for that date, selects <=10 (Botola first, then famous),
// inlines logos as data URLs, caches. On total failure serves the cache (stale).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!hasApiKey())
    return res.status(500).json({ error: "GOAL_API_KEY is not set in .env.local" });

  const date = (typeof req.query.date === "string" && req.query.date) || new Date().toISOString().slice(0, 10);
  const names = nameMap();

  const results = await Promise.allSettled(
    FEATURED_LEAGUES.map(async (lg) => {
      const raw = await goalFetch<RawFixturesResponse>(`/leagues/${lg.id}/fixtures?from=${date}&to=${date}&limit=100`);
      return normalizeFixtures(raw, lg.popularity, names).filter((m) => m.date === date);
    })
  );

  const all: Match[] = [];
  const errors: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") all.push(...r.value);
    else errors.push(`${FEATURED_LEAGUES[i].name}: ${(r.reason as Error).message}`);
  });

  // Every league failed (e.g. bad key / network) -> serve cache, flagged stale.
  if (all.length === 0 && errors.length === FEATURED_LEAGUES.length) {
    const cached = await readCache();
    if (cached)
      return res.status(200).json({ ...cached, stale: true, errors });
    const status = errors.length ? 502 : 200;
    return res.status(status).json({ date, matches: [], errors, stale: true });
  }

  const selected = selectMatchday(all);
  const cache = new Map<string, string | null>();
  for (const m of selected) {
    m.leagueLogo = await toDataUrl(m.leagueLogo, cache);
    m.home.badge = await toDataUrl(m.home.badge, cache);
    m.away.badge = await toDataUrl(m.away.badge, cache);
  }

  const payload = { date, matches: selected, fetchedAt: new Date().toISOString() };
  try {
    await fs.mkdir(path.dirname(CACHE), { recursive: true });
    await fs.writeFile(CACHE, JSON.stringify(payload));
  } catch {
    /* non-fatal */
  }
  return res.status(200).json({ ...payload, stale: false, errors, botolaCount: selected.filter((m) => m.leagueId === FEATURED_LEAGUES[0].id).length });
}
