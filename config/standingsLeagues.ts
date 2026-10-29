// Competitions the app covers, by 365scores competition id.
//
// Availability is seasonal: knockout cups have no league table until a group
// stage runs, and some competitions publish no stat leaderboards at all. That is
// deliberately NOT encoded here — each page asks the API and reports what it
// actually got, so the catalog never goes stale against the live data.
export type LeagueGroup = "المغرب" | "أفريقيا" | "أوروبا" | "دولي";

export interface StandingsLeague {
  id: number;
  name: string; // English label
  ar: string; // Arabic label (365scores displayName)
  group: LeagueGroup;
  teams?: number; // expected table size; omitted when it varies or has no table
}

export const STANDINGS_LEAGUES: StandingsLeague[] = [
  // المغرب
  { id: 557, name: "Botola Pro", ar: "البطولة الاحترافية", group: "المغرب", teams: 16 },
  { id: 5651, name: "Botola 2", ar: "البطولة الاحترافية 2", group: "المغرب", teams: 16 },
  { id: 5420, name: "Throne Cup", ar: "كأس العرش", group: "المغرب" },

  // أفريقيا
  { id: 624, name: "CAF Champions League", ar: "دوري أبطال أفريقيا", group: "أفريقيا" },
  { id: 627, name: "CAF Confederation Cup", ar: "الكونفدرالية الأفريقية", group: "أفريقيا" },
  { id: 167, name: "Africa Cup of Nations", ar: "كأس أمم إفريقيا", group: "أفريقيا" },
  { id: 588, name: "AFCON Qualifiers", ar: "تصفيات كأس أمم إفريقيا", group: "أفريقيا" },
  { id: 645, name: "CAF WC Qualifiers", ar: "تصفيات كأس العالم إفريقيا", group: "أفريقيا" },

  // أوروبا
  { id: 7, name: "Premier League", ar: "الدوري الإنجليزي", group: "أوروبا", teams: 20 },
  { id: 11, name: "La Liga", ar: "الدوري الإسباني", group: "أوروبا", teams: 20 },
  { id: 17, name: "Serie A", ar: "الدوري الإيطالي", group: "أوروبا", teams: 20 },
  { id: 25, name: "Bundesliga", ar: "الدوري الألماني", group: "أوروبا", teams: 18 },
  { id: 35, name: "Ligue 1", ar: "الدوري الفرنسي", group: "أوروبا", teams: 18 },
  { id: 57, name: "Eredivisie", ar: "الدوري الهولندي", group: "أوروبا", teams: 18 },
  { id: 572, name: "Champions League", ar: "دوري أبطال أوروبا", group: "أوروبا", teams: 36 },
  { id: 573, name: "Europa League", ar: "الدوري الأوروبي", group: "أوروبا", teams: 36 },
  { id: 472, name: "UEFA Super Cup", ar: "كأس السوبر الأوروبي", group: "أوروبا" },
  { id: 7016, name: "Nations League", ar: "دوري الأمم الأوروبية", group: "أوروبا" },
  { id: 8, name: "FA Cup", ar: "كأس الاتحاد الإنجليزي", group: "أوروبا" },
  { id: 13, name: "Copa del Rey", ar: "كأس ملك إسبانيا", group: "أوروبا" },
  { id: 20, name: "Coppa Italia", ar: "كأس إيطاليا", group: "أوروبا" },
  { id: 28, name: "DFB Pokal", ar: "كأس ألمانيا", group: "أوروبا" },

  // دولي
  { id: 5930, name: "World Cup", ar: "كأس العالم", group: "دولي" },
  { id: 6316, name: "Euro", ar: "أمم أوروبا", group: "دولي" },
  { id: 595, name: "Copa America", ar: "كوبا أمريكا", group: "دولي" },
  { id: 649, name: "Saudi League", ar: "الدوري السعودي", group: "دولي", teams: 18 },
];

export const LEAGUE_GROUPS: LeagueGroup[] = ["المغرب", "أفريقيا", "أوروبا", "دولي"];

export const BOTOLA_LEAGUE = 557;
export const BOTOLA2_LEAGUE = 5651;
export const DEFAULT_LEAGUE = BOTOLA_LEAGUE;

// The Moroccan leagues are the ones the bundled Chouf TV template is drawn for.
export const MOROCCAN_LEAGUES = [BOTOLA_LEAGUE, BOTOLA2_LEAGUE];

export function isStandingsLeague(id: number): boolean {
  return STANDINGS_LEAGUES.some((l) => l.id === id);
}

export function leagueById(id: number): StandingsLeague | undefined {
  return STANDINGS_LEAGUES.find((l) => l.id === id);
}

// Catalog grouped for <optgroup>, skipping groups with no entries.
export function leaguesByGroup(): Array<{ group: LeagueGroup; leagues: StandingsLeague[] }> {
  return LEAGUE_GROUPS.map((group) => ({
    group,
    leagues: STANDINGS_LEAGUES.filter((l) => l.group === group),
  })).filter((g) => g.leagues.length > 0);
}
