import { formationSlots, mapTotw, roundOfKey, type RawTotw } from "@/lib/totw";
import raw from "./fixtures/totw-premier-league.json";

// A real /competitions/teamOfTheWeek/ answer (Premier League, round 7).
it("maps 365scores' team of the round: eleven players, the coach apart, clubs resolved", () => {
  const t = mapTotw(raw as RawTotw)!;
  expect(t.key).toBe("7_132_1_7_1");
  expect(roundOfKey(t.key)).toBe(7);
  expect(t.formation).toBe("4-4-2");
  expect(t.players).toHaveLength(11);
  expect(t.coach?.name).toBe("تشابي الونسو");
  expect(t.players.every((p) => p.club && p.club.name && p.club.logo)).toBe(true);
  expect(t.players.every((p) => typeof p.rating === "number" && p.line !== null && p.side !== null)).toBe(true);
  const haaland = t.players.find((p) => p.shortName === "هالاند")!;
  expect(haaland.club?.name).toBe("مانشستر سيتي");
  expect(haaland.rating).toBe(9.2);
  expect(t.rounds[0]).toEqual({ name: "الجولة 7", key: "7_132_1_7_1" });
});

it("reads an empty answer — Botola has no team of the round — as none", () => {
  expect(mapTotw({})).toBeNull();
});

// 365scores spaces a row the same way in its own lineups: one centred, two at
// 25/75, three at 20/50/80, four or more evenly from touchline to touchline.
it("lays a formation out as eleven slots, keeper first, rows spaced like 365scores'", () => {
  for (const f of ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "3-4-3", "5-3-2", "4-1-4-1"]) {
    expect(formationSlots(f)).toHaveLength(11);
  }
  const s = formationSlots("4-4-2");
  expect(s[0]).toEqual({ line: 0, side: 50 });
  expect(s.slice(1, 5).map((x) => x.side)).toEqual([0, 33, 67, 100]);
  expect(s.slice(9).map((x) => x.side)).toEqual([25, 75]);
  expect(s.slice(9).every((x) => x.line === 99)).toBe(true);
  const f = formationSlots("4-2-3-1"); // keeper, 4 backs, 2 holding (5-6), 3 behind the striker (7-9), striker
  expect(f.slice(5, 7).map((x) => x.side)).toEqual([25, 75]);
  expect(f.slice(7, 10).map((x) => x.side)).toEqual([20, 50, 80]);
  expect(f[10]).toEqual({ line: 99, side: 50 });
});
