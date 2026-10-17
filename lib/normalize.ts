import type {
  RawStandingRow,
  RawStandingsResponse,
  TeamRow,
  NormalizedStandings,
} from "@/types/standings";

// Parse the API's string stats to numbers. Returns null for missing/invalid
// so the caller can warn instead of silently rendering a 0.
function toInt(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

// Pick the first field present, documented name first then aliases.
function pick(row: RawStandingRow, keys: (keyof RawStandingRow)[]): unknown {
  for (const k of keys) {
    const v = row[k];
    if (v !== null && v !== undefined && v !== "") return v;
  }
  return undefined;
}

/**
 * Normalize a GOAL API standings response into TeamRow[].
 * Documented fields (overallLeaguePosition / overallLeaguePlayed / overallLeagueW
 * / overallLeaguePTS / team.name / team.badge) are mapped first; generic aliases
 * are fallbacks only. Arabic names come from `nameMap` (teamId -> Arabic),
 * falling back to the API's original name. Missing fields are reported in
 * `warnings`, never invented.
 */
export function normalizeStandings(
  res: RawStandingsResponse | null | undefined,
  nameMap: Record<string, string> = {}
): NormalizedStandings {
  const warnings: string[] = [];
  const data = res?.data;
  if (!Array.isArray(data)) {
    return { rows: [], season: null, warnings: ["response has no `data` array"] };
  }

  let season: string | null = null;
  const rows: TeamRow[] = data.map((row, i) => {
    const teamId = String(pick(row, ["teamId"]) ?? row.team?.id ?? "");
    const nameOriginal = String(pick(row, ["teamName"]) ?? row.team?.name ?? "");
    const label = nameOriginal || teamId || `row ${i + 1}`;

    const rank = toInt(pick(row, ["overallLeaguePosition", "position", "rank"]));
    const played = toInt(
      pick(row, ["overallLeaguePlayed", "played", "matchesPlayed", "games"])
    );
    const wins = toInt(pick(row, ["overallLeagueW", "win", "wins", "won"]));
    const points = toInt(pick(row, ["overallLeaguePTS", "points", "pts"]));

    if (rank === null) warnings.push(`${label}: missing position`);
    if (played === null) warnings.push(`${label}: missing played`);
    if (wins === null) warnings.push(`${label}: missing wins`);
    if (points === null) warnings.push(`${label}: missing points`);
    if (!teamId) warnings.push(`${label}: missing teamId`);

    const rowSeason = row.league?.season ?? null;
    if (rowSeason) season = rowSeason;

    return {
      rank: rank ?? i + 1,
      teamId,
      nameOriginal,
      nameAr: (teamId && nameMap[teamId]) || nameOriginal,
      played: played ?? 0,
      wins: wins ?? 0,
      draws: toInt(pick(row, ["overallLeagueD"])),
      losses: toInt(pick(row, ["overallLeagueL"])),
      gf: toInt(pick(row, ["overallLeagueGF"])),
      ga: toInt(pick(row, ["overallLeagueGA"])),
      points: points ?? 0,
      logo: row.team?.badge ?? row.team?.logo ?? row.team?.crest ?? null,
      promotion: row.overallPromotion ?? null,
    };
  });

  rows.sort((a, b) => a.rank - b.rank);
  return { rows, season, warnings };
}
