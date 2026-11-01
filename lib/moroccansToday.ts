import { fetchLiveMatches, fetchMatchSheet, moroccansByClub } from "./live365";
import { sortRows, toMoroccanRows, type MoroccanDayRow } from "./moroccanDay";
import type { LiveMatch, MatchSheet } from "@/types/live";

// A day can tag 30+ matches. Serverless functions run out of time long before
// they run out of patience, so the reads go in small batches.
const AT_ONCE = 8;

async function inBatches(matches: LiveMatch[]): Promise<Array<MatchSheet | null>> {
  const out: Array<MatchSheet | null> = [];
  for (let i = 0; i < matches.length; i += AT_ONCE) {
    const part = await Promise.allSettled(matches.slice(i, i + AT_ONCE).map((m) => fetchMatchSheet(m.id, m.matchupId)));
    out.push(...part.map((r) => (r.status === "fulfilled" ? r.value : null))); // one bad game must not cost the day
  }
  return out;
}

/** Every Moroccan abroad on a day. `date` undefined is today. */
export async function fetchMoroccansDay(date: string, isToday: boolean): Promise<MoroccanDayRow[]> {
  const [matches, byClub] = await Promise.all([fetchLiveMatches(isToday ? undefined : date), moroccansByClub()]);
  const tagged = matches.filter((m) => m.moroccans?.length);
  const sheets = await inBatches(tagged);
  return sortRows(tagged.flatMap((m, i) =>
    toMoroccanRows(date, m, sheets[i], byClub.get(m.home.id) ?? [], byClub.get(m.away.id) ?? [])));
}
