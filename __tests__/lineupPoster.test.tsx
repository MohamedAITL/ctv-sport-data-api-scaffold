import { render } from "@testing-library/react";
import { createRef } from "react";
import LineupPoster, { spot } from "@/components/live/LineupPoster";
import { DEFAULT_LINEUP_LAYOUT } from "@/config/lineupLayout";
import type { LineupPlayer, LiveMatch, TeamLineup } from "@/types/live";

const P = DEFAULT_LINEUP_LAYOUT.pitch;
const halfway = P.y + P.h / 2;

const player = (id: number, line: number, side: number, number = id): LineupPlayer => ({
  id, athleteId: null, name: `p${id}`, shortName: `p${id}`, number, photo: null, position: null,
  role: "starting", rating: null, stats: [], topStats: [], line, side,
});

// `side` is each team's own left (0) to right (100): 365scores returns 0 for
// Davies, Calafiori, Raum and Dimarco. The two teams face each other, so the
// same number has to land on opposite sides of the poster.
it("puts each team's left flank on its own left, so the two sides mirror", () => {
  const homeLeftBack = spot(player(1, 33, 0), true, P);
  const awayLeftBack = spot(player(2, 33, 0), false, P);
  expect(homeLeftBack.x).toBeLessThan(P.x + P.w / 2); // home attacks up: left is the viewer's left
  expect(awayLeftBack.x).toBeGreaterThan(P.x + P.w / 2); // away faces them: mirrored
  expect(homeLeftBack.x - P.x).toBeCloseTo(P.x + P.w - awayLeftBack.x, 5);
});

it("keeps each team in its own half, keepers at the ends", () => {
  const homeKeeper = spot(player(1, 0, 50), true, P);
  const awayKeeper = spot(player(2, 0, 50), false, P);
  expect(homeKeeper.y).toBe(P.y + P.h - P.goalPad);
  expect(awayKeeper.y).toBe(P.y + P.goalPad);
  // The two front lines stop short of halfway instead of meeting on it.
  expect(spot(player(3, 100, 50), true, P).y).toBe(halfway + P.midGap);
  expect(spot(player(4, 100, 50), false, P).y).toBe(halfway - P.midGap);
});

it("keeps a player with an out-of-range or missing coordinate on the pitch", () => {
  const wild = spot({ ...player(1, 140, -20) }, true, P);
  expect(wild.y).toBeGreaterThanOrEqual(halfway);
  expect(wild.x).toBeGreaterThanOrEqual(P.x + P.sidePad);
  const unknown = spot({ ...player(2, 0, 0), line: null, side: null }, false, P);
  expect(unknown.x).toBe(P.x + P.w / 2);
});

it("draws both elevens with their names", () => {
  const xi = (base: number): TeamLineup => ({
    formation: "4-3-3", hasFieldPositions: true,
    starting: [0, 33, 33, 33, 33, 66, 66, 66, 99, 99, 99].map((line, i) => player(base + i, line, (i * 37) % 101)),
    bench: [], missing: [], coach: null,
  });
  const team = (id: number, name: string) => ({ id, name, score: null, logo: null });
  const match = {
    id: 1, matchupId: "1-2-3", competitionId: 3, competition: "البطولة الاحترافية", competitionLogo: null,
    startTime: "", statusText: "", clock: "", isLive: false, isFinished: false,
    home: team(1, "الجيش الملكي"), away: team(2, "الوداد الرياضي"),
  } as LiveMatch;
  const { container } = render(
    <LineupPoster ref={createRef<HTMLDivElement>()} match={match} home={xi(100)} away={xi(200)} layout={DEFAULT_LINEUP_LAYOUT} templateSrc={null} />
  );
  const text = container.textContent ?? "";
  for (let i = 0; i < 11; i++) {
    expect(text).toContain(`p${100 + i}`);
    expect(text).toContain(`p${200 + i}`);
  }
  expect(text).toContain("الجيش الملكي");
  expect(text).toContain("4-3-3");
});
