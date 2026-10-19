import type { NextApiRequest, NextApiResponse } from "next";
import { goalFetch, GoalApiError } from "@/lib/goalApi";
import { discoverBotola } from "@/lib/discovery";
import { normalizeStandings } from "@/lib/normalize";
import { fetch365Standings } from "@/lib/scores365";
import { inlineImages } from "@/lib/inlineImage";
import { validateStandings } from "@/lib/validate";
import { readSettings, writeSettings } from "@/lib/settings";
import { BOTOLA_LEAGUE, DEFAULT_LEAGUE, isStandingsLeague, leagueById } from "@/config/standingsLeagues";
import type { NormalizedStandings, RawStandingsResponse, TeamRow } from "@/types/standings";
import seedNames from "@/data/botolaTeams.json";

function nameMap(): Record<string, string> {
  const { _comment, ...rest } = seedNames as Record<string, string>;
  void _comment;
  return rest;
}

async function inlineLogos(rows: TeamRow[]): Promise<TeamRow[]> {
  return inlineImages(rows, (r) => r.logo, (r, logo) => ({ ...r, logo }));
}

// Fetch from GOAL API (fallback source) — league discovery + normalize.
async function fromGoal(settings: Awaited<ReturnType<typeof readSettings>>): Promise<{
  normalized: NormalizedStandings;
  leagueId?: string;
  leagueName?: string;
}> {
  let leagueId = settings.leagueId;
  let leagueName = settings.leagueName;
  if (!leagueId) {
    const league = await discoverBotola();
    leagueId = league.id;
    leagueName = league.name;
    await writeSettings({
      leagueId,
      leagueName,
      countryName: league.countryName,
      season: league.season ?? null,
      resolvedAt: new Date().toISOString(),
    });
  }
  const raw = await goalFetch<RawStandingsResponse>(`/leagues/${leagueId}/standings`);
  return { normalized: normalizeStandings(raw, nameMap()), leagueId, leagueName };
}

// GET /api/standings?competition=<365scores id> — fetch live standings from
// 365scores (GOAL API fallback for Botola only), inline logos, validate, cache
// per league. On failure, serve that league's last-good cache marked stale.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = Number(req.query.competition);
  const competition = isStandingsLeague(q) ? q : DEFAULT_LEAGUE;
  const meta = leagueById(competition);
  const settings = await readSettings();
  let source: "365scores" | "goal" = "365scores";
  let leagueId: string | undefined = String(competition);
  let leagueName: string | undefined = meta?.name;
  try {
    let normalized: NormalizedStandings;
    try {
      normalized = await fetch365Standings(competition, nameMap());
      if (normalized.rows.length === 0) throw new Error("365scores returned no rows");
    } catch (primaryErr) {
      // GOAL fallback only exists for Botola — other leagues have no GOAL table.
      if (competition !== BOTOLA_LEAGUE) throw primaryErr;
      source = "goal";
      const g = await fromGoal(settings);
      normalized = g.normalized;
      leagueId = g.leagueId;
      leagueName = g.leagueName;
    }

    normalized.rows = await inlineLogos(normalized.rows);
    const validation = validateStandings(normalized.rows, meta?.teams);
    const fetchedAt = new Date().toISOString();

    await writeSettings({
      lastByLeague: {
        ...settings.lastByLeague,
        [competition]: {
          rows: normalized.rows,
          season: normalized.season,
          warnings: normalized.warnings,
          fetchedAt,
        },
      },
    });

    return res.status(200).json({
      rows: normalized.rows,
      season: normalized.season ?? null,
      league: { id: leagueId, name: leagueName },
      warnings: normalized.warnings,
      validation,
      source,
      fetchedAt,
      stale: false,
    });
  } catch (e) {
    const status = e instanceof GoalApiError ? e.status : 502;
    const last = settings.lastByLeague?.[competition];
    if (last) {
      // Serve this league's previous good data, clearly flagged — never silent.
      return res.status(200).json({
        rows: last.rows,
        season: last.season,
        league: { id: leagueId, name: leagueName },
        warnings: last.warnings,
        validation: validateStandings(last.rows, meta?.teams),
        fetchedAt: last.fetchedAt,
        stale: true,
        error: (e as Error).message,
      });
    }
    return res.status(status).json({ error: (e as Error).message, stale: true });
  }
}
