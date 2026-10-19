import { fetch365Games, roundsOf, matchesInRound, UNSCHEDULED_ROUND } from "@/lib/scores365Games";

// Shapes verified live against 365scores on 2026-10-19.
const game = (id: number, roundNum: number | null, statusGroup: number, hs: number, as: number) => ({
  id,
  competitionId: 557,
  competitionDisplayName: "الدوري المغربي",
  seasonNum: 84,
  roundNum,
  startTime: "2026-10-12T20:00:00+00:00",
  statusGroup,
  statusText: statusGroup === 4 ? "انتهت" : "لم تبدأ",
  homeCompetitor: { id: 8323, name: "حسنية أكادير", score: hs, imageVersion: 2 },
  awayCompetitor: { id: 5455, name: "الجيش الملكي", score: as, imageVersion: 6 },
});

const resp = (games: unknown[]) => ({
  games,
  competitions: [{ id: 557, name: "الدوري المغربي", imageVersion: 4 }],
});

function mockFeeds(results: unknown[], current: unknown[], fixtures: unknown[]) {
  global.fetch = jest.fn(async (url: string) => {
    const pick = url.includes("/results/") ? results : url.includes("/current/") ? current : fixtures;
    return { ok: true, json: async () => resp(pick) };
  }) as unknown as typeof fetch;
}

describe("fetch365Games", () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  it("maps a finished game onto the Match shape with Arabic names and scores", async () => {
    mockFeeds([game(1, 4, 4, 2, 1)], [], []);
    const { matches, season } = await fetch365Games(557);
    expect(matches).toHaveLength(1);
    const m = matches[0];
    expect(m.round).toBe("4");
    expect(m.isFinished).toBe(true);
    expect(m.isLive).toBe(false);
    expect(m.home.nameAr).toBe("حسنية أكادير");
    expect(m.home.score).toBe(2);
    expect(m.away.score).toBe(1);
    expect(m.time).toBe("20:00"); // sliced, not timezone-converted
    expect(m.date).toBe("2026-10-12");
    expect(m.home.badge).toContain("/v2/Competitors/8323");
    expect(season).toBe("84");
  });

  it("treats -1 as 'no score yet' for a scheduled game", async () => {
    mockFeeds([], [], [game(2, null, 2, -1, -1)]);
    const { matches } = await fetch365Games(557);
    expect(matches[0].home.score).toBeNull();
    expect(matches[0].away.score).toBeNull();
    expect(matches[0].isFinished).toBe(false);
  });

  it("dedupes games repeated across the three feeds", async () => {
    const g = game(7, 4, 4, 1, 0);
    mockFeeds([g], [g], [g]);
    const { matches } = await fetch365Games(557);
    expect(matches).toHaveLength(1);
  });

  it("survives a feed that fails as long as one responds", async () => {
    global.fetch = jest.fn(async (url: string) => {
      if (url.includes("/fixtures/")) return { ok: false, status: 500, json: async () => ({}) };
      return { ok: true, json: async () => resp([game(3, 3, 4, 0, 0)]) };
    }) as unknown as typeof fetch;
    const { matches } = await fetch365Games(557);
    expect(matches).toHaveLength(1);
  });
});

describe("round grouping", () => {
  const mk = (round: string | null, id: string) =>
    ({ id, round } as unknown as Parameters<typeof matchesInRound>[0][number]);

  it("buckets games with no round separately, sorted before real rounds", () => {
    const list = [mk("4", "a"), mk(null, "b"), mk("3", "c")];
    expect(roundsOf(list)).toEqual([UNSCHEDULED_ROUND, 3, 4]);
  });

  it("selects only the matches of the requested round", () => {
    const list = [mk("4", "a"), mk(null, "b"), mk("4", "c")];
    expect(matchesInRound(list, 4).map((m) => m.id)).toEqual(["a", "c"]);
    expect(matchesInRound(list, UNSCHEDULED_ROUND).map((m) => m.id)).toEqual(["b"]);
  });

  it("reports no rounds when the schedule is not published", () => {
    expect(roundsOf([])).toEqual([]);
  });
});
