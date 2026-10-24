// "تشكيلة الجولة" — the team of the round.
//
// 365scores publishes its own for the big leagues and international
// tournaments (`/competitions/teamOfTheWeek/`, `weekKey` picks a round). It has
// none for Botola, the Throne Cup or the CAF club competitions, and those
// matches carry no player ratings either, so there the team is picked by hand
// from everyone who started the round: `fetchRoundPool`.
import { crest, FACE_IMG, fetchLiveDetail, get, Q, rowSides } from "./live365";
import { fetch365Games, matchesInRound } from "./scores365Games";

export interface TotwClub { id: number; name: string; logo: string | null }
export interface TotwPlayer {
  /** The athlete, so the same player is the same id in every source. */
  id: number;
  name: string;
  shortName: string;
  number: number | null;
  position: string | null; // Arabic
  line: number | null;
  side: number | null;
  rating: number | null;
  photo: string | null;
  club: TotwClub | null;
}
export interface TotwRound { name: string; key: string }
export interface Totw {
  rounds: TotwRound[];
  key: string;
  formation: string | null;
  players: TotwPlayer[];
  coach: TotwPlayer | null;
}
export interface RoundPool { players: TotwPlayer[]; coaches: TotwPlayer[] }

interface RawMember {
  position?: { name?: string; shortName?: string };
  yardFormation?: { fieldLine?: number; fieldSide?: number };
  ranking?: number;
  competitorId?: number;
  id?: number;
  athleteId?: number;
  name?: string;
  shortName?: string;
  jerseyNumber?: number;
  imageVersion?: number;
}
export interface RawTotw {
  teamOfTheWeek?: { key?: string; lineup?: { formation?: string; members?: RawMember[] } };
  teamOfTheWeekList?: Array<{ name?: string; key?: string }>;
  competitors?: Array<{ id?: number; name?: string; imageVersion?: number }>;
}

export function mapTotw(raw: RawTotw): Totw | null {
  const t = raw.teamOfTheWeek;
  const members = t?.lineup?.members ?? [];
  if (!t?.key || members.length === 0) return null;
  const clubs = new Map((raw.competitors ?? []).filter((c) => c.id).map((c) => [c.id as number, c]));
  const toPlayer = (m: RawMember): TotwPlayer => {
    const c = m.competitorId ? clubs.get(m.competitorId) : undefined;
    return {
      id: m.athleteId ?? m.id ?? 0,
      name: m.name ?? "",
      shortName: m.shortName || m.name || "",
      number: m.jerseyNumber ?? null,
      position: m.position?.name ?? null,
      line: m.yardFormation?.fieldLine ?? null,
      side: m.yardFormation?.fieldSide ?? null,
      rating: typeof m.ranking === "number" ? m.ranking : null,
      photo: m.athleteId ? `${FACE_IMG}/v${m.imageVersion ?? 1}/Athletes/${m.athleteId}` : null,
      club: c?.id ? { id: c.id, name: c.name ?? "", logo: crest(c.id, c.imageVersion) } : null,
    };
  };
  // The coach rides along as a twelfth member.
  const isCoach = (m: RawMember) => m.position?.shortName === "Management";
  const coach = members.find(isCoach);
  return {
    rounds: (raw.teamOfTheWeekList ?? []).flatMap((r) => (r.key ? [{ name: r.name ?? r.key, key: r.key }] : [])),
    key: t.key,
    formation: t.lineup?.formation ?? null,
    players: members.filter((m) => !isCoach(m)).map(toPlayer),
    coach: coach ? toPlayer(coach) : null,
  };
}

export async function fetchTotw(competitionId: number, weekKey?: string): Promise<Totw | null> {
  const week = weekKey ? `&weekKey=${encodeURIComponent(weekKey)}` : "";
  return mapTotw(await get<RawTotw>(`/competitions/teamOfTheWeek/?${Q}&competitions=${competitionId}${week}`));
}

/** The round a weekKey (`comp_season_stage_round_group`) belongs to. */
export const roundOfKey = (key: string): number => Number(key.split("_")[3]);

/** Rounds with at least one finished match — the ones a team can be picked for. */
export async function playedRounds(competitionId: number): Promise<number[]> {
  const { matches } = await fetch365Games(competitionId);
  const rounds = new Set(matches.filter((m) => m.isFinished && m.round !== null).map((m) => Number(m.round)));
  return Array.from(rounds).sort((a, b) => a - b);
}

// shortcut: starters only — a substitute who came on cannot be picked; add the
// benches' subbed-on players if that is ever wanted.
export async function fetchRoundPool(competitionId: number, round: number): Promise<RoundPool> {
  const { matches } = await fetch365Games(competitionId);
  const games = matchesInRound(matches, round).filter((m) => m.isFinished);
  const details = await Promise.allSettled(
    games.map((m) => fetchLiveDetail(Number(m.id), `${m.home.id}-${m.away.id}-${competitionId}`))
  );
  const players = new Map<number, TotwPlayer>();
  const coaches = new Map<number, TotwPlayer>();
  for (const d of details) {
    if (d.status !== "fulfilled" || !d.value) continue;
    const { match, homeLineup, awayLineup } = d.value;
    for (const [team, lu] of [[match.home, homeLineup], [match.away, awayLineup]] as const) {
      if (!lu) continue;
      const club: TotwClub = { id: team.id, name: team.name, logo: team.logo };
      const add = (into: Map<number, TotwPlayer>) => (p: (typeof lu.starting)[number]) => {
        const id = p.athleteId ?? p.id;
        // A replayed match lists the same players twice; keep the first.
        if (!into.has(id)) {
          into.set(id, {
            id, name: p.name, shortName: p.shortName, number: p.number, position: p.position,
            line: p.line, side: p.side, rating: p.rating, photo: p.photo, club,
          });
        }
      };
      lu.starting.forEach(add(players));
      if (lu.coach) add(coaches)(lu.coach);
    }
  }
  return { players: Array.from(players.values()), coaches: Array.from(coaches.values()) };
}

// Where each slot of a formation stands, in 365scores' own coordinates (line 0
// is the keeper's goal, side 0 the team's left), spaced the way its own
// lineups are: one player centred, two at 25/75, three at 20/50/80, more even.
export function formationSlots(formation: string): Array<{ line: number; side: number }> {
  const rows = formation.split("-").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  return [
    { line: 0, side: 50 },
    ...rows.flatMap((n, i) => rowSides(n).map((side) => ({ line: Math.round(((i + 1) / rows.length) * 99), side }))),
  ];
}

export const FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "3-4-3", "5-3-2", "4-1-4-1"];
