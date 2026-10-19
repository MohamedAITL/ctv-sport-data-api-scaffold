import type { TeamRow } from "@/types/standings";

export interface ValidationResult {
  ok: boolean;
  errors: string[]; // block generating a misleading poster
  warnings: string[]; // show, but allow
}

/**
 * Checks run before a poster is generated so we never publish a misleading or
 * incomplete table (brief §7). Errors block; warnings inform.
 */
export function validateStandings(
  rows: TeamRow[],
  expectedCount?: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rows.length) {
    errors.push("Standings are empty");
    return { ok: false, errors, warnings };
  }

  const seenTeams = new Set<string>();
  const seenRanks = new Set<number>();
  // Multi-group competitions (Nations League, World Cup) restart the numbering in
  // every group, so repeated ranks are expected there, not a data fault.
  const grouped = rows.filter((r) => r.rank === 1).length > 1;
  for (const r of rows) {
    const who = r.nameAr || r.nameOriginal || r.teamId || "a row";
    if (!r.teamId) errors.push(`${who} has no team id`);
    if (!r.nameOriginal && !r.nameAr) errors.push(`Row ${r.rank} has no team name`);
    if (!Number.isFinite(r.played) || r.played < 0) errors.push(`${who}: invalid played`);
    if (!Number.isFinite(r.wins) || r.wins < 0) errors.push(`${who}: invalid wins`);
    if (!Number.isFinite(r.points) || r.points < 0) errors.push(`${who}: invalid points`);
    if (r.wins > r.played) warnings.push(`${who}: wins (${r.wins}) > played (${r.played})`);
    if (r.teamId) {
      if (seenTeams.has(r.teamId)) errors.push(`${who} appears twice`);
      seenTeams.add(r.teamId);
    }
    if (!grouped && seenRanks.has(r.rank)) warnings.push(`Duplicate rank ${r.rank}`);
    seenRanks.add(r.rank);
    if (!r.logo) warnings.push(`${who}: no logo (fallback will show)`);
  }

  // Cups and varying-size competitions have no expected size to check against.
  if (expectedCount !== undefined && rows.length !== expectedCount)
    warnings.push(`Got ${rows.length} teams, expected ${expectedCount}`);

  return { ok: errors.length === 0, errors, warnings };
}
