import { normalizeStandings } from "@/lib/normalize";
import type { RawStandingsResponse } from "@/types/standings";

// MOCK data shaped like the live GOAL API /leagues/:id/standings response
// (verified 2026-10-17). NOT real current standings — for unit tests only.
const mock: RawStandingsResponse = {
  success: true,
  leagueId: "L1",
  data: [
    {
      teamId: "t2",
      teamName: "IR Tanger",
      overallLeaguePosition: "2",
      overallLeaguePlayed: "4",
      overallLeagueW: "2",
      overallLeagueD: "1",
      overallLeagueL: "1",
      overallLeaguePTS: "7",
      team: { id: "t2", name: "IR Tanger", badge: "https://x/badge2.jpg" },
      league: { season: "2026/2027" },
    },
    {
      teamId: "t1",
      teamName: "Hassania Agadir",
      overallLeaguePosition: "1",
      overallLeaguePlayed: "4",
      overallLeagueW: "2",
      overallLeaguePTS: "7",
      team: null, // live API sometimes omits nested team
      league: { season: "2026/2027" },
    },
  ],
};

describe("normalizeStandings", () => {
  it("maps documented fields, parses strings to numbers, sorts by rank", () => {
    const { rows, season } = normalizeStandings(mock, { t1: "حسنية أكادير" });
    expect(season).toBe("2026/2027");
    expect(rows.map((r) => r.rank)).toEqual([1, 2]); // sorted
    expect(rows[0].teamId).toBe("t1");
    expect(rows[0].nameAr).toBe("حسنية أكادير"); // nameMap applied
    expect(rows[1].nameAr).toBe("IR Tanger"); // falls back to original
    expect(rows[0].points).toBe(7);
    expect(typeof rows[0].points).toBe("number");
    expect(rows[1].logo).toBe("https://x/badge2.jpg"); // team.badge
    expect(rows[0].logo).toBeNull(); // missing team -> null (fallback later)
  });

  it("falls back to generic aliases when documented fields are absent", () => {
    const aliased: RawStandingsResponse = {
      data: [{ teamId: "a", teamName: "Alt", position: "3", played: "5", wins: "1", points: "4" }],
    };
    const { rows } = normalizeStandings(aliased);
    expect(rows[0].rank).toBe(3);
    expect(rows[0].played).toBe(5);
    expect(rows[0].wins).toBe(1);
    expect(rows[0].points).toBe(4);
  });

  it("warns instead of inventing values when fields are missing", () => {
    const { warnings } = normalizeStandings({ data: [{ teamId: "x" }] });
    expect(warnings.join(" ")).toMatch(/missing position/);
    expect(warnings.join(" ")).toMatch(/missing points/);
  });

  it("handles a response with no data array", () => {
    expect(normalizeStandings(null).rows).toEqual([]);
    expect(normalizeStandings({}).warnings[0]).toMatch(/no .data. array/);
  });
});
