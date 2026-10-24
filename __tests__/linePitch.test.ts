import { formationSpot, liveEleven } from "@/components/live/LinePitch";
import type { LineupPlayer, TeamLineup } from "@/types/live";

const p = (id: number, line: number, side: number, subbedIn: LineupPlayer["subbedIn"] = null, role: LineupPlayer["role"] = "starting"): LineupPlayer => ({
  id, athleteId: null, name: `p${id}`, shortName: `p${id}`, number: id, photo: null, position: null,
  role, rating: null, stats: [], topStats: [], line, side, subbedIn,
});

// `side` 0 is each team's own left (Davies, Calafiori: 0). Home attacks
// right-to-left on the kiosk, so its left is the bottom of the screen.
it("puts each team's left flank on its own left", () => {
  expect(formationSpot(p(1, 33, 0), true).y).toBeGreaterThan(50); // home left-back: bottom
  expect(formationSpot(p(2, 33, 0), false).y).toBeLessThan(50); // away left-back: top
});

it("keeps the edge rows off the touchlines and the strikers apart", () => {
  for (const home of [true, false]) {
    for (const side of [0, 100]) {
      const y = formationSpot(p(1, 33, side), home).y;
      expect(y).toBeGreaterThanOrEqual(10);
      expect(y).toBeLessThanOrEqual(90);
    }
  }
  const homeStriker = formationSpot(p(1, 100, 50), true).x;
  const awayStriker = formationSpot(p(2, 100, 50), false).x;
  expect(homeStriker - awayStriker).toBeGreaterThanOrEqual(10); // ~145px on the wall screen
  expect(formationSpot(p(3, 0, 50), true).x).toBeLessThanOrEqual(95); // keeper inside the goal line
});

// Real shape: 365scores marks a substitute who came on with the starter he
// replaced (substitution.playerId) and the minute.
it("shows who is on now: subs in the replaced player's spot, chains followed", () => {
  const lu: TeamLineup = {
    formation: "4-3-3", hasFieldPositions: true,
    starting: [p(1, 0, 50), p(2, 66, 20), p(3, 99, 80)],
    bench: [
      p(10, 0, 0, { replaces: 2, minute: 61 }, "substitute"),
      p(11, 0, 0, { replaces: 10, minute: 84 }, "substitute"), // the sub was subbed too
      p(12, 0, 0, null, "substitute"),
    ],
    missing: [], coach: null,
  };
  const { eleven, off } = liveEleven(lu);
  expect(eleven.map((x) => x.id)).toEqual([1, 11, 3]);
  expect([eleven[1].line, eleven[1].side]).toEqual([66, 20]); // takes the starter's spot
  expect(off.get(2)).toBe(61);
  expect(off.get(10)).toBe(84);
  expect(off.has(1)).toBe(false);
});
