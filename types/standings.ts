// Shapes for GOAL API standings, verified live against
// GET /v1/leagues/:id/standings on 2026-10-17 (Botola Pro 2026/2027).
// Stat fields come back as STRINGS in the real response.

export interface RawTeam {
  id?: string;
  name?: string;
  badge?: string; // real logo field
  logo?: string; // alias fallbacks
  crest?: string;
  country?: string;
}

export interface RawStandingRow {
  id?: string;
  teamId?: string;
  teamName?: string;
  overallLeaguePosition?: string | number;
  overallLeaguePlayed?: string | number;
  overallLeagueW?: string | number;
  overallLeagueD?: string | number;
  overallLeagueL?: string | number;
  overallLeagueGF?: string | number;
  overallLeagueGA?: string | number;
  overallLeaguePTS?: string | number;
  overallPromotion?: string | null;
  team?: RawTeam | null;
  league?: { id?: string; name?: string; season?: string | null } | null;
  // alias fallbacks (other providers / schema drift)
  position?: string | number;
  rank?: string | number;
  played?: string | number;
  matchesPlayed?: string | number;
  games?: string | number;
  win?: string | number;
  wins?: string | number;
  won?: string | number;
  points?: string | number;
  pts?: string | number;
}

export interface RawStandingsResponse {
  success?: boolean;
  leagueId?: string;
  data?: RawStandingRow[];
}

// Normalized row the poster renders from.
export interface TeamRow {
  rank: number;
  teamId: string;
  nameOriginal: string; // from API (usually English)
  nameAr: string; // from override map, falls back to nameOriginal
  played: number;
  wins: number;
  draws: number | null;
  losses: number | null;
  gf: number | null;
  ga: number | null;
  points: number;
  logo: string | null; // team.badge, a data: URL override, or null -> fallback
  promotion: string | null; // zone hint from overallPromotion
}

export interface NormalizedStandings {
  rows: TeamRow[];
  season: string | null;
  warnings: string[]; // unmapped/missing fields — surfaced, never silently filled
}

export interface League {
  id: string;
  name: string;
  countryId?: string;
  countryName?: string;
  season?: string | null;
  logo?: string | null;
  isActive?: boolean;
  standingsCount?: number;
}
