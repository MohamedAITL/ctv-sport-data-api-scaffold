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
  competitionLogo: string | null;
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
  /** The player behind the shirt — what an athlete lookup needs. */
  athleteId: number | null;
  name: string;
  shortName: string;
  number: number | null;
  photo: string | null;
  position: string | null; // Arabic
  role: LineupRole;
  /** The source's own match rating, 0-10. Null before kickoff. */
  rating: number | null;
  /** This player's stats for THIS match, in the source's order. */
  stats: PerformerStat[];
  /** The handful the source marks as headline figures. */
  topStats: PerformerStat[];
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

/** One period's worth of team statistics — whole match, first half, second. */
export interface StatGroup {
  id: number;
  name: string; // Arabic
  rows: StatRow[];
}

/** A line in a match-facts block. `away` is set when the source splits the
 *  figure per team (time wasted does, ball-in-play does not). */
export interface FactRow {
  name: string;
  value: string;
  away?: string;
}

/** The "how the 90 minutes were actually spent" block: ball in play, added
 *  time, time wasted. Published only while a match is running or just ended. */
export interface FactBlock {
  title: string;
  rows: FactRow[];
}

/** A player's season in one competition, as 365scores' own player page shows
 *  it: appearances, goals, rating, cards, xG… */
export interface AthleteSeason {
  competition: string; // Arabic
  top: PerformerStat[]; // the headline figures the source flags
  stats: PerformerStat[]; // everything else it publishes
}

/** One shot from the source's shot chart: expected goals and where it went. */
export interface Shot {
  home: boolean;
  minute: string;
  player: string | null;
  xg: string | null;
  xgot: string | null;
  bodyPart: string | null;
  outcome: string | null; // Arabic, e.g. "خارج المرمى يسار"
  isGoal: boolean;
}

/** A past match, as the previous-meetings and form lists show it. */
export interface PastMatch {
  id: number;
  date: string; // ISO
  competition: string;
  home: { name: string; score: number | null; logo: string | null };
  away: { name: string; score: number | null; logo: string | null };
}

/** The head-to-head record between the two sides, over the meetings found. */
export interface H2HRecord {
  played: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  homeGoals: number;
  awayGoals: number;
}

/** What the مواجهات سابقة tab shows: the teams' meetings, and recent form. */
export interface PreviousMatches {
  h2h: PastMatch[];
  record: H2HRecord;
  home: PastMatch[];
  away: PastMatch[];
}

/** The athlete endpoint's `fullDetails` view — none of this is in the match
 *  payload, and it is what the card shows beyond the 90 minutes on screen. */
export interface AthleteBio {
  id: number;
  name: string;
  age: number | null;
  position: string | null;
  nationality: string | null;
  shirt: number | null;
  /** Birth date, height, preferred foot — whatever the source lists. */
  details: PerformerStat[];
  summary: string | null;
  seasons: AthleteSeason[];
}

/** One of a player's headline season figures, e.g. "اهداف" → "7". */
export interface PerformerStat {
  name: string; // Arabic
  value: string;
}

export interface Performer {
  id: number;
  name: string;
  photo: string | null;
  position: string | null; // Arabic
  stats: PerformerStat[];
}

/** A pre-match comparison the source publishes before kickoff, one per line
 *  of the field ("الهجوم" / "الوسط" / "الدفاع"). */
export interface TopPerformerRow {
  name: string; // Arabic category
  home: Performer | null;
  away: Performer | null;
}

export interface LiveDetail {
  match: LiveMatch;
  homeLineup: TeamLineup | null;
  awayLineup: TeamLineup | null;
  events: LiveEvent[];
  /** Team statistics per published period; [0] is always the whole match. */
  statGroups: StatGroup[];
  /** Ball-in-play and time-wasted blocks, when the source publishes them. */
  facts: FactBlock[];
  /** Every shot the source charts, with its expected-goals value. */
  shots: Shot[];
  /** Season leaders per line — the only statistics a match has before kickoff. */
  topPerformers: TopPerformerRow[];
  venue: string | null;
  referee: string | null;
  tv: string[];
}
