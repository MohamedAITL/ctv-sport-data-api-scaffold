import type { H2HRecord, PastMatch } from "@/types/live";

/**
 * The record over a set of meetings (the poster counts one competition's),
 * from the side of club `ourId` — by id, as `fetchPreviousMatches` counts the
 * full record: a club renamed between seasons is still the same club.
 */
export function h2hRecord(meetings: PastMatch[], ourId: number): H2HRecord {
  return meetings.reduce<H2HRecord>((r, m) => {
    if (m.home.score === null || m.away.score === null) return r;
    const weHosted = m.home.id === ourId;
    const ours = weHosted ? m.home.score : m.away.score;
    const theirs = weHosted ? m.away.score : m.home.score;
    return {
      played: r.played + 1,
      homeWins: r.homeWins + (ours > theirs ? 1 : 0),
      draws: r.draws + (ours === theirs ? 1 : 0),
      awayWins: r.awayWins + (ours < theirs ? 1 : 0),
      homeGoals: r.homeGoals + ours,
      awayGoals: r.awayGoals + theirs,
    };
  }, { played: 0, homeWins: 0, draws: 0, awayWins: 0, homeGoals: 0, awayGoals: 0 });
}
