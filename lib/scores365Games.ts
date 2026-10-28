// Round fixtures/results from 365scores, mapped onto the existing `Match` shape
// so the matchday poster renders them unchanged.
//
// 365scores exposes no round filter: `roundNum` as a query param is ignored, so
// games are fetched from the game feeds and grouped by their own roundNum.
// The three feeds alone are a moving window — for Botola they held rounds 3-6
// of a 30-round season — so the `paging` links in the response are followed
// outwards until the season runs out. A league with no published schedule still
// returns fewer games, which is a normal state, not an error.
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
  countryId?: number;
  type?: number; // 1 club, 2 national team
}
interface S365Game {
  id?: number;
  sportId?: number;
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
  competitions?: Array<{ id?: number; name?: string; imageVersion?: number; countryId?: number }>;
  paging?: { previousPage?: string; nextPage?: string };
}

// Older/newer pages are anchored on a game id. The links the API returns carry
// `timezoneId=1`, which would shift every kickoff, so the URL is rebuilt with
// our own query instead of being followed verbatim.
const PAGE_MAX = 12;

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

async function page(competitionId: number, afterGame: number, direction: -1 | 1): Promise<S365Game[]> {
  const r = await fetch(`${API}/?${Q}&competitions=${competitionId}&games=1&aftergame=${afterGame}&direction=${direction}`, {
    headers: { Accept: "application/json" },
  });
  if (!r.ok) return []; // a missing page just ends the walk
  return ((await r.json()) as S365GamesResp).games ?? [];
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

  // The feeds overlap (current repeats recent results), so dedupe by id.
  const games = new Map<number, S365Game>();
  for (const r of ok) for (const g of r.games ?? []) if (g.id) games.set(g.id, g);

  // The season the league is actually in — walking backwards eventually crosses
  // into last season, and those rounds must not be mixed into this one.
  const season = ok.find((r) => r.games?.length)?.games?.[0]?.seasonNum ?? null;
  const inSeason = (g: S365Game) => season === null || g.seasonNum === season;

  // Walk out in both directions until a page adds nothing, leaves the season,
  // or the cap is hit.
  for (const direction of [-1, 1] as const) {
    for (let i = 0; i < PAGE_MAX; i++) {
      // Anchor on the game at the edge of what we hold, by kickoff — ids are
      // only roughly chronological.
      const edge = Array.from(games.values()).reduce((best, g) =>
        (g.startTime ?? "") === "" ? best
        : direction === -1
          ? (g.startTime as string) < (best.startTime ?? "~") ? g : best
          : (g.startTime as string) > (best.startTime ?? "") ? g : best
      );
      const anchor = edge.id;
      if (!anchor) break;
      const batch = await page(competitionId, anchor, direction);
      if (batch.length === 0) break;
      let added = 0;
      let leftSeason = false;
      for (const g of batch) {
        if (!g.id) continue;
        if (!inSeason(g)) { leftSeason = true; continue; }
        if (!games.has(g.id)) { games.set(g.id, g); added++; }
      }
      if (added === 0 || leftSeason) break;
    }
  }

  const matches = Array.from(games.values())
    .filter(inSeason)
    .map((g) => toMatch(g, leagueLogo))
    .filter((m) => m.id)
    .sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc));
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

// ---- The Moroccan matchday ----------------------------------------------

const MOROCCO = 127;
const BOTOLA = 557;
const BOTOLA_2 = 5651;
const THRONE_CUP = 5420;

/**
 * How high a match ranks on the matchday poster, highest first: a Morocco
 * national team (any age, men or women), Botola Pro, a Moroccan club abroad
 * (CAF Champions League / Confederation Cup, …), the Throne Cup, Botola 2,
 * then anything else Moroccan. 0 = not Moroccan at all.
 */
export function moroccanTier(g: S365Game, competitionCountry?: number): number {
  const teams = [g.homeCompetitor, g.awayCompetitor];
  if (teams.some((t) => t?.countryId === MOROCCO && t?.type === 2)) return 6;
  if (g.competitionId === BOTOLA) return 5;
  const moroccanClub = teams.some((t) => t?.countryId === MOROCCO);
  if (moroccanClub && competitionCountry !== MOROCCO) return 4;
  if (g.competitionId === THRONE_CUP) return 3;
  if (g.competitionId === BOTOLA_2) return 2;
  return moroccanClub || competitionCountry === MOROCCO ? 1 : 0;
}

/**
 * Every football match of the day that involves Moroccan football — the
 * competition or either side — ranked by `moroccanTier` (carried in `fame`, which the
 * matchday poster orders its competition groups by), then kickoff.
 */
export async function fetchMoroccanDay(isoDate: string): Promise<Match[]> {
  const [y, m, d] = isoDate.split("-");
  const day = `${d}/${m}/${y}`;
  const r = await fetch(`${API}/allScores/?${Q}&sports=1&startDate=${day}&endDate=${day}`, {
    headers: { Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`365scores allScores ${r.status}`);
  const j = (await r.json()) as S365GamesResp;
  const comps = new Map((j.competitions ?? []).filter((c) => c.id).map((c) => [c.id as number, c]));
  return (j.games ?? [])
    .filter((g) => g.sportId === 1)
    .map((g) => {
      const c = comps.get(g.competitionId ?? 0);
      const tier = moroccanTier(g, c?.countryId);
      const logo = c?.id ? `${IMG}/v${c.imageVersion ?? 1}/Competitions/light/${c.id}` : null;
      return { tier, match: { ...toMatch(g, logo), fame: tier } };
    })
    .filter((x) => x.tier > 0)
    .sort((a, b) => b.tier - a.tier || a.match.kickoffUtc.localeCompare(b.match.kickoffUtc))
    .map((x) => x.match);
}
