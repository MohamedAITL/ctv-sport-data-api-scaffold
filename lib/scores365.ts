// League standings from 365scores (by competition id). The public web API is
// not Cloudflare-blocked, needs no key, and returns Arabic team names natively,
// so it fetches directly server-side. Logos come from 365scores' image CDN, keyed
// by competitor id + imageVersion. Primary standings source; for Botola the
// caller falls back to the GOAL API if this throws.
import type { NormalizedStandings, TeamRow } from "@/types/standings";
import { BOTOLA_LEAGUE } from "@/config/standingsLeagues";

const API = "https://webws.365scores.com/web/standings/";
const IMG = "https://imagecache.365scores.com/image/upload/f_png,w_100,h_100,c_limit,q_auto";

interface S365Competitor {
  id?: number;
  name?: string;
  imageVersion?: number;
}
interface S365Row {
  competitor?: S365Competitor;
  position?: number;
  gamePlayed?: number;
  gamesWon?: number;
  gamesEven?: number;
  gamesLost?: number;
  for?: number;
  against?: number;
  points?: number;
}
interface S365Resp {
  standings?: Array<{ rows?: S365Row[]; seasonNum?: number }>;
}

export async function fetch365Standings(
  competitionId: number = BOTOLA_LEAGUE,
  nameMap: Record<string, string> = {}
): Promise<NormalizedStandings> {
  const url = `${API}?appTypeId=5&langId=27&timezoneName=Africa/Casablanca&userCountryId=131&competitions=${competitionId}&live=false`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`365scores ${r.status}`);
  const data = (await r.json()) as S365Resp;
  const block = data.standings?.[0];
  const rows: TeamRow[] = (block?.rows ?? []).map((row, i) => {
    const c = row.competitor ?? {};
    const teamId = String(c.id ?? "");
    const nameOriginal = c.name ?? "";
    return {
      rank: row.position ?? i + 1,
      teamId,
      // Names are already Arabic from 365scores; a saved override still wins.
      nameOriginal,
      nameAr: (teamId && nameMap[teamId]) || nameOriginal,
      played: row.gamePlayed ?? 0,
      wins: row.gamesWon ?? 0,
      draws: row.gamesEven ?? null,
      losses: row.gamesLost ?? null,
      gf: row.for ?? null,
      ga: row.against ?? null,
      points: row.points ?? 0,
      logo: teamId ? `${IMG}/v${c.imageVersion ?? 1}/Competitors/${teamId}` : null,
      promotion: null,
    };
  });
  rows.sort((a, b) => a.rank - b.rank);
  return { rows, season: null, warnings: [] };
}
