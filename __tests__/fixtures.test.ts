import { normalizeFixtures, selectMatchday } from "@/lib/fixtures";
import { BOTOLA_LEAGUE_ID } from "@/config/featuredLeagues";
import type { RawFixturesResponse, Match } from "@/types/fixtures";

// MOCK fixtures shaped like the live GOAL API /leagues/:id/fixtures response.
const raw: RawFixturesResponse = {
  data: [
    {
      id: "m1", matchDate: "2026-10-18", matchTime: "20:00", kickoffUtc: "2026-10-18T20:00:00Z",
      matchStatus: "FINISHED", matchPeriod: "FULL_TIME",
      leagueId: "L", leagueName: "La Liga", leagueLogo: "u/la.png",
      homeTeamId: "rm", homeTeamName: "Real Madrid", homeTeamScore: "2",
      awayTeamId: "bar", awayTeamName: "Barcelona", awayTeamScore: "1",
      teamHomeBadge: "u/rm.png", teamAwayBadge: "u/bar.png",
    },
  ],
};

describe("normalizeFixtures", () => {
  it("maps fields, applies famous-club Arabic, computes fame and finished score", () => {
    const [m] = normalizeFixtures(raw, 95);
    expect(m.home.name).toBe("Real Madrid");
    expect(m.home.nameAr).toBe("ريال مدريد");
    expect(m.away.nameAr).toBe("برشلونة");
    expect(m.home.score).toBe(2);
    expect(m.isFinished).toBe(true);
    expect(m.statusLabel).toBe("2 - 1");
    expect(m.fame).toBe(20); // two elite clubs
  });

  it("uses a teamId override before the famous-club default", () => {
    const [m] = normalizeFixtures(raw, 95, { rm: "الملكي" });
    expect(m.home.nameAr).toBe("الملكي");
  });
});

describe("selectMatchday", () => {
  const mk = (leagueId: string, fame: number, id: string): Match => ({
    id, date: "d", time: "", kickoffUtc: "2026-10-18T1" + id + ":00Z", status: "SCHEDULED", statusLabel: "",
    isFinished: false, isLive: false, leagueId, leagueName: "", leagueLogo: null, leaguePopularity: 95,
    round: null, fame,
    home: { id: "h" + id, name: "", nameAr: "", badge: null, score: null },
    away: { id: "a" + id, name: "", nameAr: "", badge: null, score: null },
  });

  it("puts every Botola match first, then fills with the most famous, capped at 10", () => {
    const all = [
      ...Array.from({ length: 3 }, (_, i) => mk(BOTOLA_LEAGUE_ID, 2, "b" + i)),
      ...Array.from({ length: 12 }, (_, i) => mk("X", i, "x" + i)), // fame 0..11
    ];
    const sel = selectMatchday(all, 10);
    expect(sel.length).toBe(10);
    expect(sel.slice(0, 3).every((m) => m.leagueId === BOTOLA_LEAGUE_ID)).toBe(true);
    // remaining 7 are the highest-fame non-Botola (11,10,9,8,7,6,5)
    expect(sel.slice(3).map((m) => m.fame)).toEqual([11, 10, 9, 8, 7, 6, 5]);
  });

  it("shows only Botola (up to cap) when it already fills the slots", () => {
    const all = Array.from({ length: 12 }, (_, i) => mk(BOTOLA_LEAGUE_ID, 2, "b" + i));
    const sel = selectMatchday(all, 10);
    expect(sel.length).toBe(10);
    expect(sel.every((m) => m.leagueId === BOTOLA_LEAGUE_ID)).toBe(true);
  });
});
