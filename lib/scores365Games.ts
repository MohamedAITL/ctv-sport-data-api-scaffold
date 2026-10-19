// Round fixtures/results from 365scores, mapped onto the existing `Match` shape
// so the matchday poster renders them unchanged.
//
// 365scores exposes no round filter: `roundNum` as a query param is ignored, so
// games are fetched from the three game feeds and grouped by their own roundNum.
// Coverage is a moving window (recent results + whatever is scheduled), not a
// season archive, and a league with no published schedule simply returns fewer
// games — that is a normal state, not an error.
import type { Match, MatchSide } from "@/types/fixtures";

const API = "https://webws.365scores.com/web/games";
const Q = "appTypeId=5&langId=27&timezoneName=Africa%2FCasablanca&userCountryId=127";
const IMG = "https://imagecache.365scores.com/image/upload/f_png,w_100,h_100,c_limit,q_auto";

// Games with no round assigned yet (scheduled before the round is published).
export const UNSCHEDULED_ROUND = -1;

interface S365Competitor {
  id?: number;
  name?: string;
  score?: number;
  imageVersion?: number;
}
interface S365Game {
  id?: number;
  competitionId?: number;
  competitionDisplayName?: string;
  seasonNum?: number;
  roundNum?: number | null;
  roundName?: string | null;
  startTime?: string;
  statusGroup?: number;
  statusText?: string;
  homeCompetitor?: S365Competitor;
  awayCompetitor?: S365Competitor;
}
interface S365GamesResp {
  games?: S365Game[];
  competitions?: Array<{ id?: number; name?: string; imageVersion?: number }>;
}

// -1 is 365scores' "no score yet" sentinel.
const score = (v: number | undefined): number | null =>
  v === undefined || v === null || v < 0 ? null : Math.round(v);

const side = (c: S365Competitor | undefined): MatchSide => {
  const id = String(c?.id ?? "");
  const name = c?.name ?? "";
  return {
    id,
    name,
    nameAr: name, // 365scores already returns Arabic (langId=27)
    badge: id ? `${IMG}/v${c?.imageVersion ?? 1}/Competitors/${id}` : null,
    score: score(c?.score),
    pen: null,
  };
};

async function feed(path: string, competitionId: number): Promise<S365GamesResp> {
  const r = await fetch(`${API}/${path}/?${Q}&competitions=${competitionId}`, {
    headers: { Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`365scores games/${path} ${r.status}`);
  return (await r.json()) as S365GamesResp;
}

function toMatch(g: S365Game, leagueLogo: string | null): Match {
  // startTime is already local to the requested timezone; slicing avoids a
  // second timezone conversion that would shift the displayed kickoff.
  const start = g.startTime ?? "";
  const isFinished = g.statusGroup === 4;
  const isLive = g.statusGroup === 3;
  return {
    id: String(g.id ?? ""),
    date: start.slice(0, 10),
    time: start.slice(11, 16),
    kickoffUtc: start,
    status: String(g.statusGroup ?? ""),
    statusLabel: g.statusText ?? "",
    isFinished,
    isLive,
    leagueId: String(g.competitionId ?? ""),
    leagueName: g.competitionDisplayName ?? "",
    leagueLogo,
    leaguePopularity: 0,
    round: g.roundNum === null || g.roundNum === undefined ? null : String(g.roundNum),
    fame: 0,
    home: side(g.homeCompetitor),
    away: side(g.awayCompetitor),
  };
}

export interface GamesResult {
  matches: Match[];
  season: string | null;
}

export async function fetch365Games(competitionId: number): Promise<GamesResult> {
  const feeds = await Promise.allSettled([
    feed("results", competitionId),
    feed("current", competitionId),
    feed("fixtures", competitionId),
  ]);
  const ok = feeds.filter((f) => f.status === "fulfilled").map((f) => f.value);
  if (ok.length === 0) throw new Error("365scores returned no game feeds");

  const meta = ok.find((r) => r.competitions?.length)?.competitions?.[0];
  const leagueLogo = meta?.id
    ? `${IMG}/v${meta.imageVersion ?? 1}/Competitions/light/${meta.id}`
    : null;

  // The three feeds overlap (current repeats recent results), so dedupe by id.
  const byId = new Map<string, Match>();
  for (const r of ok) {
    for (const g of r.games ?? []) {
      const m = toMatch(g, leagueLogo);
      if (m.id) byId.set(m.id, m);
    }
  }
  const matches = Array.from(byId.values()).sort((a, b) =>
    a.kickoffUtc.localeCompare(b.kickoffUtc)
  );
  const season = ok.find((r) => r.games?.length)?.games?.[0]?.seasonNum;
  return { matches, season: season != null ? String(season) : null };
}

// Round number for grouping; unassigned games get their own bucket.
export const roundOf = (m: Match): number =>
  m.round === null ? UNSCHEDULED_ROUND : Number(m.round);

export function roundsOf(matches: Match[]): number[] {
  return Array.from(new Set(matches.map(roundOf))).sort((a, b) => a - b);
}

export function matchesInRound(matches: Match[], round: number): Match[] {
  return matches.filter((m) => roundOf(m) === round);
}
