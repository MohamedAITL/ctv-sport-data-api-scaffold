// Live football from 365scores for the touchscreen match centre.
//
// Two things here are easy to get wrong and are the reason this file exists:
//   1. /game/ returns NO lineups, events or members unless `matchupId` is sent.
//      The id is just `home-away-competition`, so we build it ourselves.
//   2. Lower-tier leagues publish no lineup at all (verified on an English
//      Southern League and a Colombian second-division game). Every lineup field
//      is therefore optional and the caller must cope with null.
import type {
  LineupPlayer, LineupRole, LiveDetail, LiveEvent, LiveMatch,
  StatFilter, StatRow, TeamLineup,
} from "@/types/live";

const B = "https://webws.365scores.com/web";
const Q = "appTypeId=5&langId=27&timezoneName=Africa%2FCasablanca&userCountryId=127";
const IMG = "https://imagecache.365scores.com/image/upload/f_png,w_120,h_120,c_limit,q_auto";

const FOOTBALL = 1;
const STATUS_LIVE = 3;
const STATUS_FINISHED = 4;

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${B}${path}`, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`365scores ${r.status} for ${path}`);
  return (await r.json()) as T;
}

const crest = (id?: number, v?: number) =>
  id ? `${IMG}/v${v ?? 1}/Competitors/${id}` : null;

// -1 is 365scores' "no score yet" sentinel.
const score = (v?: number): number | null =>
  v === undefined || v === null || v < 0 ? null : Math.round(v);

interface RawCompetitor { id?: number; name?: string; score?: number; imageVersion?: number }
interface RawGame {
  id?: number;
  sportId?: number;
  competitionId?: number;
  competitionDisplayName?: string;
  startTime?: string;
  statusGroup?: number;
  statusText?: string;
  gameTimeDisplay?: string;
  homeCompetitor?: RawCompetitor;
  awayCompetitor?: RawCompetitor;
}

export function toMatch(g: RawGame): LiveMatch | null {
  const h = g.homeCompetitor ?? {};
  const a = g.awayCompetitor ?? {};
  if (!g.id || !h.id || !a.id) return null;
  return {
    id: g.id,
    matchupId: `${h.id}-${a.id}-${g.competitionId ?? 0}`,
    competitionId: g.competitionId ?? 0,
    competition: g.competitionDisplayName ?? "",
    startTime: g.startTime ?? "",
    statusText: g.statusText ?? "",
    clock: g.gameTimeDisplay ?? "",
    isLive: g.statusGroup === STATUS_LIVE,
    isFinished: g.statusGroup === STATUS_FINISHED,
    home: { id: h.id, name: h.name ?? "", score: score(h.score), logo: crest(h.id, h.imageVersion) },
    away: { id: a.id, name: a.name ?? "", score: score(a.score), logo: crest(a.id, a.imageVersion) },
  };
}

/** Football matches for today; live first, then upcoming, then finished. */
export async function fetchLiveMatches(): Promise<LiveMatch[]> {
  const d = await get<{ games?: RawGame[] }>(`/games/allScores/?${Q}&live=true`);
  const all = (d.games ?? [])
    .filter((g) => g.sportId === FOOTBALL)
    .map(toMatch)
    .filter((m): m is LiveMatch => m !== null);
  const rank = (m: LiveMatch) => (m.isLive ? 0 : m.isFinished ? 2 : 1);
  return all.sort((x, y) => rank(x) - rank(y) || x.startTime.localeCompare(y.startTime));
}

// ---- detail ----------------------------------------------------------------

const ROLE: Record<number, LineupRole> = { 1: "starting", 2: "substitute", 3: "missing", 4: "coach" };

interface RawMember { id?: number; name?: string; shortName?: string; jerseyNumber?: number; athleteId?: number; imageVersion?: number }
interface RawLineupMember {
  id?: number;
  status?: number;
  position?: { name?: string };
  yardFormation?: { fieldLine?: number; fieldSide?: number };
}
interface RawLineups { formation?: string; hasFieldPositions?: boolean; members?: RawLineupMember[] }
interface RawDetailCompetitor extends RawCompetitor { lineups?: RawLineups }
interface RawEvent {
  competitorId?: number; gameTimeDisplay?: string; playerId?: number;
  eventType?: { name?: string }; isMajor?: boolean; order?: number;
}
interface RawDetail {
  game?: RawGame & {
    members?: RawMember[];
    events?: RawEvent[];
    officials?: Array<{ name?: string }>;
    tvNetworks?: Array<{ name?: string }>;
    venue?: { name?: string };
    homeCompetitor?: RawDetailCompetitor;
    awayCompetitor?: RawDetailCompetitor;
  };
}
interface RawStat {
  id?: number; name?: string; competitorId?: number;
  value?: string; valuePercentage?: number; isMajor?: boolean;
}
interface RawStats {
  statistics?: RawStat[];
  statisticsFilters?: Array<{ filterId?: number; name?: string }>;
}

function buildLineup(lu: RawLineups | undefined, members: RawMember[]): TeamLineup | null {
  if (!lu?.members?.length) return null; // league publishes no lineup
  const byId = new Map(members.map((m) => [m.id, m]));
  const players: Array<LineupPlayer & { role: LineupRole }> = lu.members.map((lm) => {
    const m = byId.get(lm.id) ?? {};
    return {
      id: lm.id ?? 0,
      name: m.name ?? "",
      shortName: m.shortName || m.name || "",
      number: m.jerseyNumber ?? null,
      photo: m.athleteId ? `${IMG}/v${m.imageVersion ?? 1}/Athletes/${m.athleteId}` : null,
      position: lm.position?.name ?? null,
      role: ROLE[lm.status ?? 0] ?? "substitute",
      line: lm.yardFormation?.fieldLine ?? null,
      side: lm.yardFormation?.fieldSide ?? null,
    };
  });
  const of = (r: LineupRole) => players.filter((p) => p.role === r);
  return {
    formation: lu.formation ?? null,
    hasFieldPositions: Boolean(lu.hasFieldPositions),
    starting: of("starting"),
    bench: of("substitute"),
    missing: of("missing"),
    coach: of("coach")[0] ?? null,
  };
}

/** Pair the flat per-team stat rows into one row per stat. */
export function pairStats(rows: RawStat[], homeId: number, awayId: number): StatRow[] {
  const byId = new Map<number, StatRow>();
  for (const r of rows) {
    if (r.id === undefined) continue;
    const row = byId.get(r.id) ?? {
      id: r.id, name: r.name ?? "", homeValue: "", awayValue: "",
      homePercent: 0, awayPercent: 0, isMajor: Boolean(r.isMajor),
    };
    const pct = Math.round((r.valuePercentage ?? 0) * 100);
    if (r.competitorId === homeId) { row.homeValue = r.value ?? ""; row.homePercent = pct; }
    else if (r.competitorId === awayId) { row.awayValue = r.value ?? ""; row.awayPercent = pct; }
    byId.set(r.id, row);
  }
  // Keep only stats that actually reported for at least one side.
  return Array.from(byId.values()).filter((r) => r.homeValue !== "" || r.awayValue !== "");
}

export async function fetchLiveDetail(gameId: number, matchupId: string): Promise<LiveDetail | null> {
  // Stats failing must not cost us the lineup, so they are settled separately.
  const [detRes, statRes] = await Promise.allSettled([
    get<RawDetail>(`/game/?${Q}&gameId=${gameId}&matchupId=${encodeURIComponent(matchupId)}`),
    get<RawStats>(`/game/stats/?${Q}&games=${gameId}`),
  ]);
  if (detRes.status !== "fulfilled") return null;
  const g = detRes.value.game;
  if (!g) return null;
  const match = toMatch(g);
  if (!match) return null;

  const members = g.members ?? [];
  const byPlayer = new Map(members.map((m) => [m.id, m]));
  const events: LiveEvent[] = (g.events ?? []).map((e, i) => ({
    competitorId: e.competitorId ?? 0,
    minute: e.gameTimeDisplay ?? "",
    type: e.eventType?.name ?? "",
    player: byPlayer.get(e.playerId)?.name ?? null,
    isMajor: Boolean(e.isMajor),
    order: e.order ?? i,
  }));

  const stats = statRes.status === "fulfilled"
    ? pairStats(statRes.value.statistics ?? [], match.home.id, match.away.id)
    : [];
  const statFilters: StatFilter[] = statRes.status === "fulfilled"
    ? (statRes.value.statisticsFilters ?? []).map((f) => ({ id: f.filterId ?? -1, name: f.name ?? "" }))
    : [];

  return {
    match,
    homeLineup: buildLineup(g.homeCompetitor?.lineups, members),
    awayLineup: buildLineup(g.awayCompetitor?.lineups, members),
    events: events.sort((a, b) => a.order - b.order),
    stats,
    statFilters,
    venue: g.venue?.name ?? null,
    referee: g.officials?.[0]?.name ?? null,
    tv: (g.tvNetworks ?? []).map((t) => t.name ?? "").filter(Boolean),
  };
}
