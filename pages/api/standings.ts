import type { NextApiRequest, NextApiResponse } from "next";
import { goalFetch, GoalApiError, hasApiKey } from "@/lib/goalApi";
import { discoverBotola } from "@/lib/discovery";
import { normalizeStandings } from "@/lib/normalize";
import { validateStandings } from "@/lib/validate";
import { readSettings, writeSettings } from "@/lib/settings";
import type { RawStandingsResponse, TeamRow } from "@/types/standings";
import seedNames from "@/data/botolaTeams.json";

function nameMap(): Record<string, string> {
  const { _comment, ...rest } = seedNames as Record<string, string>;
  void _comment;
  return rest;
}

// Fetch a remote logo server-side and inline it as a data URL, so html-to-image
// can embed it in the client export without a tainted canvas / CORS error.
async function toDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "image/png";
    const buf = Buffer.from(await r.arrayBuffer());
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function inlineLogos(rows: TeamRow[]): Promise<TeamRow[]> {
  return Promise.all(
    rows.map(async (r) => ({ ...r, logo: await toDataUrl(r.logo) }))
  );
}

// GET /api/standings — resolve league, fetch live standings, normalize, inline
// logos, validate, cache. On failure, serve the last-good cache marked stale.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!hasApiKey())
    return res.status(500).json({ error: "GOAL_API_KEY is not set in .env.local" });

  const settings = await readSettings();
  try {
    let leagueId = settings.leagueId;
    let leagueName = settings.leagueName;
    let season = settings.season;
    if (!leagueId) {
      const league = await discoverBotola();
      leagueId = league.id;
      leagueName = league.name;
      season = league.season ?? null;
      await writeSettings({
        leagueId,
        leagueName,
        countryName: league.countryName,
        season,
        resolvedAt: new Date().toISOString(),
      });
    }

    const raw = await goalFetch<RawStandingsResponse>(`/leagues/${leagueId}/standings`);
    const normalized = normalizeStandings(raw, nameMap());
    normalized.rows = await inlineLogos(normalized.rows);
    const validation = validateStandings(normalized.rows);
    const fetchedAt = new Date().toISOString();

    await writeSettings({
      lastStandings: {
        rows: normalized.rows,
        season: normalized.season,
        warnings: normalized.warnings,
        fetchedAt,
      },
    });

    return res.status(200).json({
      rows: normalized.rows,
      season: normalized.season ?? season ?? null,
      league: { id: leagueId, name: leagueName },
      warnings: normalized.warnings,
      validation,
      fetchedAt,
      stale: false,
    });
  } catch (e) {
    const status = e instanceof GoalApiError ? e.status : 502;
    const last = settings.lastStandings;
    if (last) {
      // Serve previous good data, clearly flagged — never a silent failure.
      return res.status(200).json({
        rows: last.rows,
        season: last.season,
        league: { id: settings.leagueId, name: settings.leagueName },
        warnings: last.warnings,
        validation: validateStandings(last.rows),
        fetchedAt: last.fetchedAt,
        stale: true,
        error: (e as Error).message,
      });
    }
    return res.status(status).json({ error: (e as Error).message, stale: true });
  }
}
