// League stat leaderboards from 365scores: 8 player categories + 8 team
// categories, already in Arabic (langId=27).
//
// `block.statsTypes` is NOT used to label values — it is mismatched on team
// blocks (the "goals per match" block lists yellow-card/assist types). The
// block's own `name` plus `rows[].stats[0].value` are what the site displays.

const API = "https://webws.365scores.com/web/stats/";
const Q = "appTypeId=5&langId=27&timezoneName=Africa%2FCasablanca&userCountryId=127";
const IMG = "https://imagecache.365scores.com/image/upload/f_png,w_120,h_120,c_limit,q_auto";

export interface StatRow {
  rank: number;
  id: string;
  name: string;
  value: string;
  secondary: string | null;
  image: string | null; // player photo or club crest
  clubImage: string | null; // player's club crest (null for team rows)
}

export interface StatCategory {
  key: string; // e.g. "player-1"
  kind: "player" | "team";
  name: string; // Arabic category title
  average: { text: string; value: string } | null;
  rows: StatRow[];
}

interface S365Entity {
  id?: number;
  name?: string;
  competitorId?: number;
}
interface S365StatRow {
  position?: number;
  secondaryStatName?: string | null;
  entity?: S365Entity;
  stats?: Array<{ typeId?: number; value?: string }>;
}
interface S365Block {
  id?: number;
  name?: string;
  averageStat?: { text?: string; value?: string } | null;
  rows?: S365StatRow[];
}
interface S365StatsResp {
  stats?: { athletesStats?: S365Block[]; competitorsStats?: S365Block[] };
}

function mapBlock(b: S365Block, kind: "player" | "team"): StatCategory {
  const rows: StatRow[] = (b.rows ?? []).map((r, i) => {
    const e = r.entity ?? {};
    const id = String(e.id ?? "");
    const club = e.competitorId != null ? String(e.competitorId) : null;
    return {
      rank: r.position != null && r.position > 0 ? r.position : i + 1,
      id,
      name: e.name ?? "",
      value: r.stats?.[0]?.value ?? "",
      secondary: r.secondaryStatName || null,
      image:
        kind === "player"
          ? id
            ? `${IMG}/Athletes/${id}`
            : null
          : club
          ? `${IMG}/Competitors/${club}`
          : null,
      clubImage: kind === "player" && club ? `${IMG}/Competitors/${club}` : null,
    };
  });
  rows.sort((a, b2) => a.rank - b2.rank);
  return {
    key: `${kind}-${b.id ?? 0}`,
    kind,
    name: b.name ?? "",
    average: b.averageStat?.value ? { text: b.averageStat.text ?? "", value: b.averageStat.value } : null,
    rows,
  };
}

export async function fetch365Stats(competitionId: number): Promise<StatCategory[]> {
  const r = await fetch(`${API}?${Q}&competitions=${competitionId}&competitors=&withSeasons=true`, {
    headers: { Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`365scores stats ${r.status}`);
  const d = (await r.json()) as S365StatsResp;
  const players = (d.stats?.athletesStats ?? []).map((b) => mapBlock(b, "player"));
  const teams = (d.stats?.competitorsStats ?? []).map((b) => mapBlock(b, "team"));
  return [...players, ...teams].filter((c) => c.rows.length > 0);
}
