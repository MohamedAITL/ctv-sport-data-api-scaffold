// Normalised shapes for the live match centre. The UI never touches raw
// 365scores JSON, so a change at the source is absorbed in lib/live365.ts.

export interface LiveTeam {
  id: number;
  name: string;
  score: number | null;
  logo: string | null;
}

export interface LiveMatch {
  id: number;
  /** `${homeId}-${awayId}-${competitionId}` — required to get lineups/events. */
  matchupId: string;
  competitionId: number;
  competition: string;
  startTime: string;
  /** Arabic status, e.g. "الشوط الأول" / "انتهت" / "لم تبدأ". */
  statusText: string;
  /** Arabic clock, e.g. "45'" — empty when not running. */
  clock: string;
  isLive: boolean;
  isFinished: boolean;
  home: LiveTeam;
  away: LiveTeam;
}

export type LineupRole = "starting" | "substitute" | "missing" | "coach";

export interface LineupPlayer {
  id: number;
  name: string;
  shortName: string;
  number: number | null;
  photo: string | null;
  position: string | null; // Arabic
  role: LineupRole;
  /** Pitch coordinates, 0–100. `line` is depth from own goal, `side` lateral. */
  line: number | null;
  side: number | null;
}

export interface TeamLineup {
  formation: string | null;
  hasFieldPositions: boolean;
  starting: LineupPlayer[];
  bench: LineupPlayer[];
  missing: LineupPlayer[];
  coach: LineupPlayer | null;
}

export interface LiveEvent {
  competitorId: number;
  minute: string;
  type: string; // Arabic, e.g. "بطاقة صفراء"
  player: string | null;
  isMajor: boolean;
  order: number;
}

export interface StatRow {
  id: number;
  name: string; // Arabic
  homeValue: string;
  awayValue: string;
  homePercent: number;
  awayPercent: number;
  isMajor: boolean;
}

export interface StatFilter {
  id: number;
  name: string;
}

export interface LiveDetail {
  match: LiveMatch;
  homeLineup: TeamLineup | null;
  awayLineup: TeamLineup | null;
  events: LiveEvent[];
  stats: StatRow[];
  statFilters: StatFilter[];
  venue: string | null;
  referee: string | null;
  tv: string[];
}
