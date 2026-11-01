// What a Moroccan abroad did on a day, shaped for the screen and the poster.
// Pure and client-safe: the fetching lives in lib/moroccansToday.ts.
import type { LineupPlayer, LiveMatch, MatchSheet, MoroccanPlayer, TeamLineup } from "@/types/live";

export type MoroccanRole = "starting" | "came_on" | "bench" | "missing" | "out" | "unknown";

export interface MoroccanDayRow {
  key: string; // `${matchId}-${playerId}`
  date: string; // the day it was asked for, YYYY-MM-DD
  playerId: number;
  name: string;
  photo: string | null;
  club: string;
  clubLogo: string | null;
  opponent: string;
  competition: string;
  competitionId: number;
  /** Goals for and against, from the player's side. Null before kickoff. */
  score: { for: number; against: number } | null;
  kickoff: string; // ISO
  isLive: boolean;
  isFinished: boolean;
  clock: string;
  role: MoroccanRole;
  /** The minute a substitute came on. */
  cameOn: number | null;
  minutes: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  rating: number | null;
}

/** One player's week, added up across every match he was named for. */
export interface MoroccanWeekRow {
  playerId: number;
  name: string;
  photo: string | null;
  club: string;
  clubLogo: string | null;
  matches: number;
  minutes: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  rating: number | null;
  /** His latest match: where this row's images are fetched from. */
  source: { date: string; key: string };
}

/** On the pitch in a match that has begun: a confirmed starter hasn't played yet at 13:00 for a 15:00 kickoff. */
export const hasPlayed = (r: Pick<MoroccanDayRow, "role" | "isLive" | "isFinished">) =>
  (r.isLive || r.isFinished) && (r.role === "starting" || r.role === "came_on");

const stat = (p: LineupPlayer, name: string) => parseInt(p.stats.find((s) => s.name === name)?.value ?? "", 10) || 0;

function placeOf(lineup: TeamLineup, id: number): { role: MoroccanRole; player: LineupPlayer | null } {
  const hit = (list: LineupPlayer[]) => list.find((p) => p.athleteId === id) ?? null;
  const starter = hit(lineup.starting);
  if (starter) return { role: "starting", player: starter };
  const sub = hit(lineup.bench);
  if (sub) return { role: sub.subbedIn ? "came_on" : "bench", player: sub };
  const out = hit(lineup.missing);
  return out ? { role: "missing", player: out } : { role: "out", player: null };
}

/**
 * Every Moroccan in a match, from its real lineup. A predicted lineup is not a
 * lineup: until it is confirmed, the role stays unknown.
 */
export function toMoroccanRows(
  date: string, match: LiveMatch, sheet: MatchSheet | null, homePlayers: MoroccanPlayer[], awayPlayers: MoroccanPlayer[],
): MoroccanDayRow[] {
  const side = (players: MoroccanPlayer[], isHome: boolean): MoroccanDayRow[] => {
    const own = isHome ? match.home : match.away;
    const other = isHome ? match.away : match.home;
    const lineup = sheet ? (isHome ? sheet.home : sheet.away) : null;
    const known = lineup !== null && (isHome ? sheet?.homeConfirmed : sheet?.awayConfirmed) === true;
    const started = match.isLive || match.isFinished;
    return players.map((p) => {
      const { role, player } = known ? placeOf(lineup, p.id) : { role: "unknown" as const, player: null };
      const cards = (sheet?.cards ?? []).filter((c) => player !== null && c.playerId === player.id);
      return {
        key: `${match.id}-${p.id}`,
        date,
        playerId: p.id,
        name: p.name,
        photo: p.photo,
        club: own.name,
        clubLogo: own.logo,
        opponent: other.name,
        competition: match.competition,
        competitionId: match.competitionId,
        score: own.score !== null && other.score !== null ? { for: own.score, against: other.score } : null,
        kickoff: match.startTime,
        isLive: match.isLive,
        isFinished: match.isFinished,
        clock: match.clock,
        role,
        cameOn: player?.subbedIn?.minute ?? null,
        minutes: player ? stat(player, "الدقائق") : 0,
        goals: player ? stat(player, "الأهداف") : 0,
        assists: player ? stat(player, "صناعة") : 0,
        yellow: cards.filter((c) => !c.red).length,
        red: cards.filter((c) => c.red).length,
        rating: started ? player?.rating ?? null : null, // before kickoff the feed sends a form figure, not a match rating
      };
    });
  };
  return [...side(homePlayers, true), ...side(awayPlayers, false)];
}

/** Playing now first, then whoever did most, then kickoff. */
export function sortRows<T extends MoroccanDayRow>(rows: T[]): T[] {
  const rank = (r: T) => (r.isLive && hasPlayed(r) ? 0 : hasPlayed(r) ? 1 : r.role === "unknown" ? 2 : 3);
  return [...rows].sort((a, b) =>
    rank(a) - rank(b) || b.goals - a.goals || b.assists - a.assists ||
    (b.rating ?? 0) - (a.rating ?? 0) || a.kickoff.localeCompare(b.kickoff));
}

/** Adds up the matches each player played; those he didn't play are left out. */
export function addUpWeek(days: MoroccanDayRow[][]): MoroccanWeekRow[] {
  const byPlayer = new Map<number, MoroccanWeekRow & { rated: number[] }>();
  for (const r of days.flat()) {
    if (!hasPlayed(r)) continue;
    const held = byPlayer.get(r.playerId) ?? {
      playerId: r.playerId, name: r.name, photo: r.photo, club: r.club, clubLogo: r.clubLogo,
      matches: 0, minutes: 0, goals: 0, assists: 0, yellow: 0, red: 0, rating: null, rated: [],
      source: { date: r.date, key: r.key },
    };
    held.matches += 1;
    held.minutes += r.minutes;
    held.goals += r.goals;
    held.assists += r.assists;
    held.yellow += r.yellow;
    held.red += r.red;
    if (r.rating !== null) held.rated.push(r.rating);
    if (r.date >= held.source.date) held.source = { date: r.date, key: r.key };
    byPlayer.set(r.playerId, held);
  }
  return Array.from(byPlayer.values())
    .map(({ rated, ...row }) => ({ ...row, rating: rated.length ? Math.round((rated.reduce((a, b) => a + b, 0) / rated.length) * 10) / 10 : null }))
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || (b.rating ?? 0) - (a.rating ?? 0) || b.minutes - a.minutes);
}

/** A status in words. Arabic, as the poster prints it. */
export function roleLabel(r: Pick<MoroccanDayRow, "role" | "cameOn" | "isFinished">): string {
  if (r.role === "starting") return "أساسي";
  if (r.role === "came_on") return r.cameOn !== null ? `بديل د ${r.cameOn}` : "بديل";
  if (r.role === "bench") return r.isFinished ? "لم يشارك" : "على الدكة";
  if (r.role === "missing") return "غائب";
  if (r.role === "out") return "خارج القائمة";
  return "لم تُعلن التشكيلة";
}

/** One line of the poster. */
export interface MoroccanLine {
  key: string;
  name: string;
  photo: string | null;
  clubLogo: string | null;
  meta: string;
  chips: string[];
  /** Null for a week: his matches may span several. */
  competitionId: number | null;
  /** The same figures as tiles, for a poster of this one player. */
  stats: Array<{ key: string; value: string; label: string }>;
}

// Arabic counts its one and two in words.
const count = (n: number, one: string, two: string, many: string) => (n === 1 ? one : n === 2 ? two : `${n} ${many}`);

const figures = (r: { goals: number; assists: number; rating: number | null }) => [
  ...(r.goals ? [count(r.goals, "هدف", "هدفان", "أهداف")] : []),
  ...(r.assists ? [count(r.assists, "صناعة هدف", "صناعتان", "صناعات")] : []),
  ...(r.rating !== null ? [`تقييم ${r.rating.toFixed(1)}`] : []),
];

const tiles = (r: { goals: number; assists: number; rating: number | null; minutes: number; yellow: number; red: number }) => [
  ...(r.goals ? [{ key: "goals", value: String(r.goals), label: "الأهداف" }] : []),
  ...(r.assists ? [{ key: "assists", value: String(r.assists), label: "صناعة الأهداف" }] : []),
  ...(r.rating !== null ? [{ key: "rating", value: r.rating.toFixed(1), label: "التقييم" }] : []),
  ...(r.minutes ? [{ key: "minutes", value: String(r.minutes), label: "الدقائق" }] : []),
  ...(r.yellow ? [{ key: "yellow", value: String(r.yellow), label: "البطاقات الصفراء" }] : []),
  ...(r.red ? [{ key: "red", value: String(r.red), label: "البطاقات الحمراء" }] : []),
];

export const dayLine = (r: MoroccanDayRow): MoroccanLine => {
  const done = hasPlayed(r) ? [...figures(r), ...(r.role === "came_on" ? [roleLabel(r)] : r.minutes ? [`${r.minutes} دقيقة`] : [])].slice(0, 3) : [];
  return {
    key: r.key,
    name: r.name,
    photo: r.photo,
    clubLogo: r.clubLogo,
    meta: `${r.club}${r.score ? ` ${r.score.for}-${r.score.against} ` : " × "}${r.opponent}`,
    chips: done.length ? done : [roleLabel(r)],
    competitionId: r.competitionId ?? null, // a day cached before this field has none
    stats: hasPlayed(r) ? tiles(r) : [{ key: "role", value: roleLabel(r), label: "الحالة" }],
  };
};

export const weekLine = (r: MoroccanWeekRow): MoroccanLine => ({
  key: r.source.key,
  name: r.name,
  photo: r.photo,
  clubLogo: r.clubLogo,
  meta: `${r.club} · ${count(r.matches, "مباراة واحدة", "مباراتان", "مباريات")} · ${r.minutes} دقيقة`,
  chips: figures(r).slice(0, 3),
  competitionId: null,
  stats: tiles(r),
});
