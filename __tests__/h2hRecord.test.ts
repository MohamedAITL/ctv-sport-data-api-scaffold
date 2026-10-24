import { h2hRecord } from "@/lib/h2hRecord";
import type { PastMatch } from "@/types/live";

type Side = [id: number, name: string, score: number | null];
const meeting = (id: number, competitionId: number, home: Side, away: Side): PastMatch => ({
  id, competitionId, date: `2025-01-0${id}T20:00:00Z`, competition: String(competitionId),
  home: { id: home[0], name: home[1], score: home[2], logo: null },
  away: { id: away[0], name: away[1], score: away[2], logo: null },
});

const BAYERN = 331;
const ARSENAL = 104;
const b = (score: number | null, name = "بايرن ميونخ"): Side => [BAYERN, name, score];
const a = (score: number | null): Side => [ARSENAL, "أرسنال", score];

// The sides swap host and guest between meetings, so the record is read from
// the club, not from which column the meeting puts it in.
it("counts the record from our side whichever end it played", () => {
  const r = h2hRecord([
    meeting(1, 3, a(3), b(1)), // away loss
    meeting(2, 3, b(1), a(0)), // home win
    meeting(3, 3, b(2), a(2)), // draw
  ], BAYERN);
  expect(r).toEqual({ played: 3, homeWins: 1, draws: 1, awayWins: 1, homeGoals: 4, awayGoals: 5 });
});

// Matched on the name, a club listed under an older name in a past season
// would be counted as the opponent's win.
it("recognises the club by id even when an old meeting spells it differently", () => {
  const r = h2hRecord([meeting(1, 3, b(2, "بايرن ميونيخ"), a(0))], BAYERN);
  expect(r.homeWins).toBe(1);
  expect(r.awayWins).toBe(0);
});

it("skips a meeting with no result and counts nothing from an empty set", () => {
  expect(h2hRecord([meeting(4, 3, b(null), a(0))], BAYERN).played).toBe(0);
  expect(h2hRecord([], BAYERN)).toEqual({ played: 0, homeWins: 0, draws: 0, awayWins: 0, homeGoals: 0, awayGoals: 0 });
});

// What the poster filters on: the same competition keeps its id across seasons
// and stages, while the display name gains "- ربع النهائي" in the knockout.
it("separates the tie's own competition from the rest", () => {
  const all = [
    meeting(1, 3, a(3), b(1)),
    meeting(2, 3, b(1), a(0)),
    meeting(3, 77, b(1), a(1)), // a summer cup
  ];
  const here = all.filter((m) => m.competitionId === 3);
  expect(here).toHaveLength(2);
  expect(h2hRecord(here, BAYERN).played).toBe(2);
  expect(h2hRecord(here, BAYERN).draws).toBe(0);
});
