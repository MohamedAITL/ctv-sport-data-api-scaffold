import type { NextApiRequest, NextApiResponse } from "next";
import { discoverBotola } from "@/lib/discovery";
import { readSettings, writeSettings } from "@/lib/settings";
import { GoalApiError, hasApiKey } from "@/lib/goalApi";
import { publicError } from "@/lib/publicError";

// GET /api/competitions — resolve (and cache) the Morocco Botola Pro league +
// current season. `?refresh=1` forces re-discovery.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!hasApiKey())
    return res.status(500).json({ error: "مفتاح الوصول غير مضبوط في .env.local" });

  const cached = await readSettings();
  if (!req.query.refresh && cached.leagueId) {
    return res.status(200).json({
      league: {
        id: cached.leagueId,
        name: cached.leagueName,
        countryName: cached.countryName,
        season: cached.season,
      },
      source: "cache",
    });
  }

  try {
    const league = await discoverBotola();
    await writeSettings({
      leagueId: league.id,
      leagueName: league.name,
      countryName: league.countryName,
      season: league.season ?? null,
      resolvedAt: new Date().toISOString(),
    });
    return res.status(200).json({ league, source: "api" });
  } catch (e) {
    const status = e instanceof GoalApiError ? e.status : 502;
    return res.status(status).json({ error: publicError(e) });
  }
}
