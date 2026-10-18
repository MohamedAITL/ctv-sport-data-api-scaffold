import type { NextApiRequest, NextApiResponse } from "next";
import { goalFetch, GoalApiError } from "@/lib/goalApi";
import { discoverBotola } from "@/lib/discovery";
import { normalizeStandings } from "@/lib/normalize";
import { fetchBotolaStandings } from "@/lib/sofascore";
import { validateStandings } from "@/lib/validate";
import { readSettings, writeSettings } from "@/lib/settings";
import type { NormalizedStandings, RawStandingsResponse, TeamRow } from "@/types/standings";
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

// GET /api/standings — fetch live standings (SofaScore first, GOAL API as
// fallback), inline logos, validate, cache. If both sources fail, serve the
// last-good cache marked stale. Never a silent failure.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const settings = await readSettings();
  let source: "sofascore" | "goal" = "sofascore";
  let leagueId = settings.leagueId;
  let leagueName = settings.leagueName;
  try {
    let normalized: NormalizedStandings;
    try {
      normalized = await fetchBotolaStandings(nameMap());
      if (normalized.rows.length === 0) throw new Error("SofaScore returned no rows");
    } catch (sofaErr) {
      // SofaScore unreachable (no proxy / Cloudflare) — fall back to GOAL API.
      source = "goal";
      const g = await fromGoal(settings);
      normalized = g.normalized;
      leagueId = g.leagueId;
      leagueName = g.leagueName;
      void sofaErr;
    }

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
      season: normalized.season ?? settings.season ?? null,
      league: { id: leagueId, name: leagueName },
      warnings: normalized.warnings,
      validation,
      source,
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
