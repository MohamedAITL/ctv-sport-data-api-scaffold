// Leagues available in the standings poster, by 365scores competition id.
export interface StandingsLeague {
  id: number;
  name: string; // English label
  ar: string; // Arabic label (365scores displayName)
  teams: number; // expected table size (completeness check)
}

export const STANDINGS_LEAGUES: StandingsLeague[] = [
  { id: 557, name: "Botola Pro", ar: "البطولة الاحترافية", teams: 16 },
  { id: 11, name: "La Liga", ar: "الدوري الإسباني", teams: 20 },
  { id: 7, name: "Premier League", ar: "الدوري الإنجليزي", teams: 20 },
  { id: 572, name: "Champions League", ar: "دوري أبطال أوروبا", teams: 36 },
];

export const BOTOLA_LEAGUE = 557;
export const DEFAULT_LEAGUE = BOTOLA_LEAGUE;

export function isStandingsLeague(id: number): boolean {
  return STANDINGS_LEAGUES.some((l) => l.id === id);
}

export function leagueById(id: number): StandingsLeague | undefined {
  return STANDINGS_LEAGUES.find((l) => l.id === id);
}
