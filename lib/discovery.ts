// Resolve the Morocco Botola Pro league + current season from the live API,
// instead of trusting a first result or a stale hardcoded id. The id below is
// only a last-resort hint (from the public coverage page); it is always verified
// against /leagues/:id before use.
import { goalFetch } from "@/lib/goalApi";
import type { League } from "@/types/standings";

const BOTOLA_ID_HINT = "cmr77dw7800g9rx06v6a4zya0";

interface CountryLite { id?: string; name?: string }
interface LeagueLite {
  id?: string;
  name?: string;
  countryId?: string;
  countryName?: string;
  season?: string | null;
  logo?: string | null;
  isActive?: boolean;
  _count?: { standings?: number };
}

function matchesBotola(name?: string): boolean {
  return /botola\s*pro/i.test(name || "");
}

async function leagueById(id: string): Promise<League | null> {
  try {
    const r = await goalFetch<{ data?: LeagueLite }>(`/leagues/${id}`);
    const l = r?.data;
    if (!l?.id || !matchesBotola(l.name)) return null;
    return toLeague(l);
  } catch {
    return null;
  }
}

function toLeague(l: LeagueLite): League {
  return {
    id: l.id!,
    name: l.name || "Botola Pro",
    countryId: l.countryId,
    countryName: l.countryName,
    season: l.season ?? null,
    logo: l.logo ?? null,
    isActive: l.isActive,
    standingsCount: l._count?.standings,
  };
}

/** Find Morocco Botola Pro: countries -> Morocco -> its leagues, with fallbacks. */
export async function discoverBotola(): Promise<League> {
  // 1. Verify the id hint first — cheapest path, and confirms it's really Botola.
  const byHint = await leagueById(BOTOLA_ID_HINT);
  if (byHint) return byHint;

  // 2. Morocco -> leagues.
  try {
    const countries = await goalFetch<{ data?: CountryLite[] }>("/countries");
    const morocco = (countries.data || []).find((c) => /morocco/i.test(c.name || ""));
    if (morocco?.id) {
      const leagues = await goalFetch<{ data?: LeagueLite[] }>(
        `/countries/${morocco.id}/leagues`
      );
      const botola = (leagues.data || []).find((l) => matchesBotola(l.name));
      if (botola?.id) {
        // re-fetch for season/_count which the list may omit
        return (await leagueById(botola.id)) || toLeague(botola);
      }
    }
  } catch {
    /* fall through */
  }

  // 3. Global league list.
  try {
    const leagues = await goalFetch<{ data?: LeagueLite[] }>("/leagues?limit=1000");
    const botola = (leagues.data || []).find(
      (l) => matchesBotola(l.name) && /morocco/i.test(l.countryName || "")
    );
    if (botola?.id) return (await leagueById(botola.id)) || toLeague(botola);
  } catch {
    /* fall through */
  }

  throw new Error("Could not resolve the Morocco Botola Pro league from the GOAL API");
}
