// Live football from 365scores for the touchscreen match centre.
//
// Two things here are easy to get wrong and are the reason this file exists:
//   1. /game/ returns NO lineups, events or members unless `matchupId` is sent.
//      The id is just `home-away-competition`, so we build it ourselves.
//   2. Lower-tier leagues publish no lineup at all (verified on an English
//      Southern League and a Colombian second-division game). Every lineup field
//      is therefore optional and the caller must cope with null.
import type {
  AthleteBio, FactBlock, FactRow, LineupPlayer, LineupRole, LiveDetail, LiveEvent,
  LiveMatch, Performer, PerformerStat, StatGroup, StatRow, TeamLineup,
  TopPerformerRow,
} from "@/types/live";
import { STANDINGS_LEAGUES } from "@/config/standingsLeagues";

const B = "https://webws.365scores.com/web";
const Q = "appTypeId=5&langId=27&timezoneName=Africa%2FCasablanca&userCountryId=127";
// `d_…` is Cloudinary's default-image transform: 365scores serves its own
// placeholder instead of a 404 when a crest or player photo is missing, which
// keeps a wall display free of broken images and the console free of noise.
const IMG = "https://imagecache.365scores.com/image/upload/f_png,w_120,h_120,c_limit,q_auto";
const CREST_IMG = `${IMG},d_Competitors:default1.png`;
const FACE_IMG = `${IMG},d_Athletes:default.png`;

const FOOTBALL = 1;
const STATUS_LIVE = 3;
const STATUS_FINISHED = 4;

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${B}${path}`, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`365scores ${r.status} for ${path}`);
  return (await r.json()) as T;
}

const crest = (id?: number, v?: number) =>
  id ? `${CREST_IMG}/v${v ?? 1}/Competitors/${id}` : null;

// There is no Competitions default asset — verified 404 on competitions 5677
// and 5509 with every casing — but the Competitors one renders, so it stands in
// for a missing competition badge instead of a 404 on the wall display.
const COMP_IMG = `${IMG},d_Competitors:default1.png`;
export const competitionLogo = (id: number) => `${COMP_IMG}/v1/Competitions/${id}`;

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
    competitionLogo: g.competitionId ? competitionLogo(g.competitionId) : null,
    startTime: g.startTime ?? "",
    statusText: g.statusText ?? "",
    clock: g.gameTimeDisplay ?? "",
    isLive: g.statusGroup === STATUS_LIVE,
    isFinished: g.statusGroup === STATUS_FINISHED,
    home: { id: h.id, name: h.name ?? "", score: score(h.score), logo: crest(h.id, h.imageVersion) },
    away: { id: a.id, name: a.name ?? "", score: score(a.score), logo: crest(a.id, a.imageVersion) },
  };
}

// The competitions the rest of the app already cares about, so the 180+ match
// day doesn't open on the Guatemalan second division.
const MAJOR = new Set(STANDINGS_LEAGUES.map((l) => l.id));

/** "2026-10-18" -> "18/10/2026", the only date format allScores honours. */
export function toApiDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Football matches, live first, then the competitions we follow, then the rest.
 * Pass an ISO date for a past day — `date=`/`dates=` are silently ignored by the
 * source, only `startDate`/`endDate` work.
 */
export async function fetchLiveMatches(isoDate?: string): Promise<LiveMatch[]> {
  const day = isoDate ? `&startDate=${encodeURIComponent(toApiDate(isoDate))}&endDate=${encodeURIComponent(toApiDate(isoDate))}` : "";
  const d = await get<{ games?: RawGame[] }>(`/games/allScores/?${Q}&live=true${day}`);
  const all = (d.games ?? [])
    .filter((g) => g.sportId === FOOTBALL)
    .map(toMatch)
    .filter((m): m is LiveMatch => m !== null);
  // Live always outranks not-live; within each band the competitions the app
  // follows come first, so the rail never opens on a third-division fixture.
  const rank = (m: LiveMatch) => {
    const major = MAJOR.has(m.competitionId) ? 0 : 1;
    const state = m.isLive ? 0 : m.isFinished ? 1 : 2;
    return state * 2 + major;
  };
  return all.sort((x, y) => rank(x) - rank(y) || x.startTime.localeCompare(y.startTime));
}

// ---- detail ----------------------------------------------------------------

const ROLE: Record<number, LineupRole> = { 1: "starting", 2: "substitute", 3: "missing", 4: "coach" };

interface RawMember { id?: number; name?: string; shortName?: string; jerseyNumber?: number; athleteId?: number; imageVersion?: number }
interface RawPlayerStat { name?: string; value?: string; isTop?: boolean }
interface RawLineupMember {
  id?: number;
  status?: number;
  position?: { name?: string };
  yardFormation?: { fieldLine?: number; fieldSide?: number };
  /** The source's match rating, and this player's own stat line. */
  ranking?: number;
  stats?: RawPlayerStat[];
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
    topPerformers?: RawTopPerformers;
    homeCompetitor?: RawDetailCompetitor;
    awayCompetitor?: RawDetailCompetitor;
  };
}
interface RawStat {
  id?: number; name?: string; competitorId?: number;
  value?: string; valuePercentage?: number; isMajor?: boolean;
}
interface RawFact { name?: string; value?: string; competitorId?: number }
interface RawActualStats {
  actualPlayTime?: { title?: string; actualTime?: RawFact; totalTime?: RawFact };
  general?: RawFact[];
  addedTime?: { title?: string; stats?: RawFact[] };
  wastedTime?: { title?: string; stats?: RawFact[] };
}
interface RawStats {
  statistics?: RawStat[];
  statisticsFilters?: Array<{ filterId?: number; name?: string }>;
  actualGameStatistics?: RawActualStats;
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
      athleteId: m.athleteId ?? null,
      number: m.jerseyNumber ?? null,
      photo: m.athleteId ? `${FACE_IMG}/v${m.imageVersion ?? 1}/Athletes/${m.athleteId}` : null,
      position: lm.position?.name ?? null,
      role: ROLE[lm.status ?? 0] ?? "substitute",
      rating: typeof lm.ranking === "number" ? lm.ranking : null,
      stats: playerStats(lm.stats),
      topStats: playerStats(lm.stats).filter((_, i) => (lm.stats ?? [])[i]?.isTop),
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

const playerStats = (rows?: RawPlayerStat[]): PerformerStat[] =>
  (rows ?? [])
    .filter((r) => r.name && r.value !== undefined && r.value !== null)
    .map((r) => ({ name: r.name as string, value: String(r.value) }));

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

interface RawPerformer {
  id?: number; athleteId?: number; name?: string; imageVersion?: number;
  positionName?: string; stats?: Array<{ name?: string; value?: string }>;
}
interface RawTopPerformers {
  categories?: Array<{ name?: string; homePlayer?: RawPerformer; awayPlayer?: RawPerformer }>;
}

const performer = (p?: RawPerformer): Performer | null =>
  p && p.id
    ? {
        id: p.id,
        name: p.name ?? "",
        photo: p.athleteId ? `${FACE_IMG}/v${p.imageVersion ?? 1}/Athletes/${p.athleteId}` : null,
        position: p.positionName ?? null,
        stats: (p.stats ?? [])
          .filter((s) => s.name && s.value)
          .map((s) => ({ name: s.name as string, value: s.value as string })),
      }
    : null;

/**
 * Season leaders per line of the field. This is the only statistical content a
 * match has before kickoff — `/game/stats/` returns no `statistics` key at all
 * until the first whistle — and it rides along on the detail call we already
 * make, so it costs no extra request.
 */
export function toTopPerformers(tp?: RawTopPerformers): TopPerformerRow[] {
  return (tp?.categories ?? [])
    .map((c) => ({ name: c.name ?? "", home: performer(c.homePlayer), away: performer(c.awayPlayer) }))
    .filter((r) => r.home || r.away);
}

// Some blocks publish one figure per team under the same name (time wasted),
// others a single figure (ball in play) — so same-name rows are paired rather
// than listed twice.
const factBlock = (
  title: string | undefined, items: Array<RawFact | undefined>, homeId: number, awayId: number
): FactBlock | null => {
  const rows: FactRow[] = [];
  const byName = new Map<string, FactRow>();
  for (const i of items) {
    if (!i?.name) continue;
    const value = String(i.value ?? "");
    const existing = byName.get(i.name);
    if (existing && i.competitorId === awayId) { existing.away = value; continue; }
    if (existing) { existing.away = existing.value; existing.value = value; continue; }
    const row: FactRow = i.competitorId === awayId ? { name: i.name, value: "", away: value } : { name: i.name, value };
    byName.set(i.name, row);
    rows.push(row);
  }
  return rows.length ? { title: title ?? "", rows } : null;
};

// The play-time rows carry no `value`: the figure is the tail of the label
// ("لُعِبَ بالفعل 48:55"), so it is split back out rather than dropped.
const splitTime = (f?: RawFact): RawFact | undefined => {
  if (!f?.name) return undefined;
  if (f.value) return f;
  const m = /^(.*?)\s*(\d{1,3}:\d{2})$/.exec(f.name.trim());
  return m ? { name: m[1], value: m[2] } : { name: f.name, value: "" };
};

/** Ball-in-play, added time and time wasted — only published mid-match. */
export function toFacts(a: RawActualStats | undefined, homeId: number, awayId: number): FactBlock[] {
  if (!a) return [];
  return [
    factBlock(a.actualPlayTime?.title, [splitTime(a.actualPlayTime?.actualTime), splitTime(a.actualPlayTime?.totalTime)], homeId, awayId),
    factBlock(a.addedTime?.title, a.addedTime?.stats ?? [], homeId, awayId),
    factBlock(a.wastedTime?.title, a.wastedTime?.stats ?? [], homeId, awayId),
    factBlock("تفاصيل", a.general ?? [], homeId, awayId),
  ].filter((b): b is FactBlock => b !== null);
}

/** A player's bio — none of this is in the match payload. */
export async function fetchAthlete(athleteId: number): Promise<AthleteBio | null> {
  const d = await get<{ athletes?: Array<{ id?: number; name?: string; age?: number; position?: { name?: string }; nationalityName?: string }> }>(
    `/athletes/?${Q}&athletes=${athleteId}`
  );
  const a = d.athletes?.[0];
  if (!a?.id) return null;
  return {
    id: a.id,
    name: a.name ?? "",
    age: typeof a.age === "number" ? a.age : null,
    position: a.position?.name ?? null,
    nationality: a.nationalityName ?? null,
  };
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

  // The default response is the whole match; each extra filter the source
  // advertises (halves, usually) is a separate call, so they are fetched
  // together rather than one tap at a time.
  const statGroups: StatGroup[] = [];
  let facts: FactBlock[] = [];
  if (statRes.status === "fulfilled") {
    const base = statRes.value;
    facts = toFacts(base.actualGameStatistics, match.home.id, match.away.id);
    const rows = pairStats(base.statistics ?? [], match.home.id, match.away.id);
    const filters = (base.statisticsFilters ?? []).map((f) => ({ id: f.filterId ?? -1, name: f.name ?? "" }));
    if (rows.length) statGroups.push({ id: -1, name: filters[0]?.name || "المباراة", rows });
    const extra = filters.filter((f) => f.id !== -1);
    const more = await Promise.allSettled(
      extra.map((f) => get<RawStats>(`/game/stats/?${Q}&games=${gameId}&filterId=${f.id}`))
    );
    more.forEach((r, i) => {
      if (r.status !== "fulfilled") return;
      const g = pairStats(r.value.statistics ?? [], match.home.id, match.away.id);
      if (g.length) statGroups.push({ id: extra[i].id, name: extra[i].name, rows: g });
    });
  }

  return {
    match,
    homeLineup: buildLineup(g.homeCompetitor?.lineups, members),
    awayLineup: buildLineup(g.awayCompetitor?.lineups, members),
    events: events.sort((a, b) => a.order - b.order),
    statGroups,
    facts,
    topPerformers: toTopPerformers(g.topPerformers),
    venue: g.venue?.name ?? null,
    referee: g.officials?.[0]?.name ?? null,
    tv: (g.tvNetworks ?? []).map((t) => t.name ?? "").filter(Boolean),
  };
}
