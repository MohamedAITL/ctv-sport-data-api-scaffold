import { h2hRecord } from "@/lib/h2hRecord";
import type { PastMatch } from "@/types/live";

const meeting = (id: number, competitionId: number, home: [string, number], away: [string, number]): PastMatch => ({
  id, competitionId, date: `2025-01-0${id}T20:00:00Z`, competition: String(competitionId),
  home: { name: home[0], score: home[1], logo: null },
  away: { name: away[0], score: away[1], logo: null },
});

const BAYERN = "بايرن ميونخ";
const ARSENAL = "أرسنال";

// The sides swap host and guest between meetings, so the record has to be read
// from the name, not from which column the meeting happens to put them in.
it("counts the record from our side whichever end it played", () => {
  const r = h2hRecord([
    meeting(1, 3, [ARSENAL, 3], [BAYERN, 1]), // away loss
    meeting(2, 3, [BAYERN, 1], [ARSENAL, 0]), // home win
    meeting(3, 3, [BAYERN, 2], [ARSENAL, 2]), // draw
  ], BAYERN);
  expect(r).toEqual({ played: 3, homeWins: 1, draws: 1, awayWins: 1, homeGoals: 4, awayGoals: 5 });
});

it("skips a meeting with no result and counts nothing from an empty set", () => {
  const unplayed = { ...meeting(4, 3, [BAYERN, 0], [ARSENAL, 0]), home: { name: BAYERN, score: null, logo: null } };
  expect(h2hRecord([unplayed], BAYERN).played).toBe(0);
  expect(h2hRecord([], BAYERN)).toEqual({ played: 0, homeWins: 0, draws: 0, awayWins: 0, homeGoals: 0, awayGoals: 0 });
});

// What the poster filters on: the same competition keeps its id across seasons
// and stages, while the display name gains "- ربع النهائي" in the knockout.
it("separates the tie's own competition from the rest", () => {
  const all = [
    meeting(1, 3, [ARSENAL, 3], [BAYERN, 1]),
    meeting(2, 3, [BAYERN, 1], [ARSENAL, 0]),
    meeting(3, 77, [BAYERN, 1], [ARSENAL, 1]), // a summer cup
  ];
  const here = all.filter((m) => m.competitionId === 3);
  expect(here).toHaveLength(2);
  expect(h2hRecord(here, BAYERN).played).toBe(2);
  expect(h2hRecord(here, BAYERN).draws).toBe(0);
});
