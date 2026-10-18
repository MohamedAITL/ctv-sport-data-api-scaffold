// Botola Pro standings from SofaScore (tournament 937). The standings JSON lives
// behind Cloudflare and rejects every server-side client, so it is routed through
// a Cloudflare-solving proxy when STANDINGS_PROXY is set (a URL template holding
// {url}); without it the direct call 403s and the caller falls back to GOAL.
// Team logos come from img.sofascore.com, which is NOT blocked, so they skip the
// proxy and inline directly.
import type { NormalizedStandings, TeamRow } from "@/types/standings";

const TOURNAMENT = 937;
const SEASON_FALLBACK = 102220; // current Botola season id; used if discovery fails
const API = "https://api.sofascore.com/api/v1";
const IMG = "https://img.sofascore.com/api/v1";

function proxied(url: string): string {
  const tmpl = process.env.STANDINGS_PROXY;
  return tmpl ? tmpl.replace("{url}", encodeURIComponent(url)) : url;
}

async function sfFetch<T>(path: string): Promise<T> {
  const r = await fetch(proxied(`${API}${path}`), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      Referer: "https://www.sofascore.com/",
    },
  });
  if (!r.ok) throw new Error(`SofaScore ${r.status} for ${path}`);
  return (await r.json()) as T;
}

interface SfRow {
  position?: number;
  matches?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  scoresFor?: number;
  scoresAgainst?: number;
  points?: number;
  team?: { id?: number; name?: string };
  promotion?: { text?: string };
}
interface SfStandings {
  standings?: Array<{ rows?: SfRow[]; name?: string; tournament?: { season?: { year?: string } } }>;
}
interface SfSeasons {
  seasons?: Array<{ id?: number; year?: string }>;
}

// Highest season id = most recent (SofaScore ids increment each season).
async function currentSeasonId(): Promise<number> {
  try {
    const { seasons } = await sfFetch<SfSeasons>(`/unique-tournament/${TOURNAMENT}/seasons`);
    const ids = (seasons ?? []).map((s) => s.id ?? 0).filter(Boolean);
    return ids.length ? Math.max(...ids) : SEASON_FALLBACK;
  } catch {
    return SEASON_FALLBACK;
  }
}

export async function fetchBotolaStandings(
  nameMap: Record<string, string> = {}
): Promise<NormalizedStandings> {
  const seasonId = await currentSeasonId();
  const data = await sfFetch<SfStandings>(
    `/unique-tournament/${TOURNAMENT}/season/${seasonId}/standings/total`
  );
  const block = data.standings?.[0];
  const rows: TeamRow[] = (block?.rows ?? []).map((r, i) => {
    const teamId = String(r.team?.id ?? "");
    const nameOriginal = r.team?.name ?? "";
    return {
      rank: r.position ?? i + 1,
      teamId,
      nameOriginal,
      nameAr: (teamId && nameMap[teamId]) || nameOriginal,
      played: r.matches ?? 0,
      wins: r.wins ?? 0,
      draws: r.draws ?? null,
      losses: r.losses ?? null,
      gf: r.scoresFor ?? null,
      ga: r.scoresAgainst ?? null,
      points: r.points ?? 0,
      logo: teamId ? `${IMG}/team/${teamId}/image` : null,
      promotion: r.promotion?.text ?? null,
    };
  });
  rows.sort((a, b) => a.rank - b.rank);
  const season = block?.tournament?.season?.year ?? block?.name ?? String(seasonId);
  return { rows, season, warnings: [] };
}
