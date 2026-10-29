import { fetch365Stats, type StatCategory } from "./scores365Stats";
import { moroccansByClub } from "./live365";
import { STANDINGS_LEAGUES } from "@/config/standingsLeagues";
import type { MoroccanPlayer } from "@/types/live";

/** A Morocco international in a competition's top-20 for one statistic. */
export interface MoroccanHighlight {
  key: string; // `${competitionId}-${categoryId}-${playerId}`
  playerId: number;
  name: string;
  photo: string | null;
  clubLogo: string | null;
  competitionId: number;
  competition: string;
  competitionLogo: string | null;
  category: string;
  rank: number;
  value: string;
  secondary: string | null;
  /** Cards: a leaderboard nobody wants to top. */
  negative: boolean;
}

const LOGO = "https://imagecache.365scores.com/image/upload/f_png,w_120,h_120,c_limit,q_auto/Competitions";
// The spotlight draws the face at ~500px: the 120px rail thumbnail would blur.
const bigFace = (url: string | null) => url && url.replace("w_120,h_120", "w_400,h_400");
const NEGATIVE = /بطاقات/;

/** Pure: the Moroccan rows of each competition's player leaderboards. */
export function pickHighlights(
  boards: Array<{ competitionId: number; categories: StatCategory[] }>,
  players: Map<number, MoroccanPlayer>,
): MoroccanHighlight[] {
  const order = new Map(STANDINGS_LEAGUES.map((l, i) => [l.id, i]));
  const out: MoroccanHighlight[] = [];
  for (const { competitionId, categories } of boards) {
    const league = STANDINGS_LEAGUES.find((l) => l.id === competitionId);
    for (const c of categories) {
      if (c.kind !== "player") continue;
      for (const r of c.rows) {
        const p = players.get(Number(r.id));
        if (!p) continue;
        out.push({
          key: `${competitionId}-${c.key.replace("player-", "")}-${p.id}`,
          playerId: p.id,
          name: r.name || p.name,
          photo: bigFace(p.photo),
          clubLogo: r.clubImage,
          competitionId,
          competition: league?.ar ?? "",
          competitionLogo: `${LOGO}/${competitionId}`,
          category: c.name,
          rank: r.rank,
          value: r.value,
          secondary: r.secondary,
          negative: NEGATIVE.test(c.name),
        });
      }
    }
  }
  return out.sort((a, b) => a.rank - b.rank || (order.get(a.competitionId) ?? 99) - (order.get(b.competitionId) ?? 99));
}

const TTL_MS = 60 * 60 * 1000;
let cache: { at: number; list: MoroccanHighlight[] } | null = null;

// shortcut: only players in the national-team squads (~40) are recognised —
// leaderboard rows carry no nationality; upgrade with an athlete lookup if
// uncalled Moroccans abroad are wanted.
export async function fetchMoroccanHighlights(): Promise<MoroccanHighlight[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.list;
  const byClub = await moroccansByClub();
  const players = new Map(Array.from(byClub.values()).flat().map((p) => [p.id, p]));
  const settled = await Promise.allSettled(
    STANDINGS_LEAGUES.map(async (l) => ({ competitionId: l.id, categories: await fetch365Stats(l.id) })),
  );
  const boards = settled.flatMap((s) => (s.status === "fulfilled" ? [s.value] : []));
  // Every competition failing is an outage, not "no Moroccan in any top 20".
  if (boards.length === 0) throw new Error("stats feeds unavailable");
  const list = pickHighlights(boards, players);
  cache = { at: Date.now(), list };
  return list;
}
