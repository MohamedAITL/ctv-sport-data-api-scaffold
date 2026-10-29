import { fetch365Games, roundsOf, matchesInRound, roundKey, roundsWithLabels, UNSCHEDULED_ROUND } from "@/lib/scores365Games";

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

describe("fetch365Games paging", () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  // Verified live: the three feeds held only rounds 3-6 of Botola's 30-round
  // season. The rest is reachable only by following the `paging` anchors.
  const dated = (id: number, round: number, day: string, season = 84) => ({
    ...game(id, round, 4, 1, 0), seasonNum: season, startTime: `${day}T20:00:00+00:00`,
  });

  it("walks back and forward until the pages run out, and stops at the season line", async () => {
    const back1 = [dated(10, 1, "2026-09-24"), dated(11, 2, "2026-09-30")];
    const lastSeason = [dated(1, 29, "2026-05-20", 83), dated(2, 30, "2026-05-27", 83)];
    const forward = [dated(40, 7, "2026-11-06")];
    const seen: string[] = [];
    global.fetch = jest.fn(async (url: string) => {
      seen.push(url);
      let games: unknown[] = [];
      if (url.includes("aftergame=")) {
        const back = url.includes("direction=-1");
        if (back) games = url.includes("aftergame=20") ? back1 : lastSeason;
        else games = url.includes("aftergame=21") ? forward : [];
      } else if (url.includes("/results/")) {
        games = [dated(20, 4, "2026-10-16")];
      } else if (url.includes("/fixtures/")) {
        games = [dated(21, 5, "2026-10-23")];
      }
      return { ok: true, json: async () => resp(games) };
    }) as unknown as typeof fetch;

    const { matches } = await fetch365Games(557);
    // rounds 1,2 (paged back), 4 and 5 (feeds), 7 (paged forward) — never 29/30
    expect(roundsOf(matches)).toEqual([1, 2, 4, 5, 7]);
    expect(matches.some((m) => m.round === "29" || m.round === "30")).toBe(false);
    // anchored on the edge game by kickoff, not on an arbitrary id
    expect(seen.some((u) => u.includes("aftergame=20") && u.includes("direction=-1"))).toBe(true);
    expect(seen.some((u) => u.includes("aftergame=21") && u.includes("direction=1"))).toBe(true);
  });

  it("stops walking when a page repeats what we already hold", async () => {
    let pages = 0;
    global.fetch = jest.fn(async (url: string) => {
      if (url.includes("aftergame=")) pages++;
      return { ok: true, json: async () => resp([dated(20, 4, "2026-10-16")]) };
    }) as unknown as typeof fetch;
    await fetch365Games(557);
    expect(pages).toBe(2); // one probe each way, both of which add nothing
  });
});

describe("rounds for any competition", () => {
  const m = (id: string, round: string | null, stageNum: number | null, stageName: string | null) =>
    ({ id, round, stageNum, stageName }) as unknown as import("@/types/fixtures").Match;

  it("a league numbers its rounds and does not name its single stage", () => {
    expect(roundsWithLabels([m("1", "8", 1, "الموسم"), m("2", "7", 1, "الموسم")])).toEqual([
      { key: 1007, label: "الجولة 7" },
      { key: 1008, label: "الجولة 8" },
    ]);
  });

  it("a cup is grouped by its stages, in order, named by the feed", () => {
    const list = [m("1", null, 2, "دور الـ 32"), m("2", null, 1, "الدور 1"), m("3", null, 2, "دور الـ 32")];
    expect(roundsWithLabels(list)).toEqual([
      { key: 1000, label: "الدور 1" },
      { key: 2000, label: "دور الـ 32" },
    ]);
    expect(roundKey(list[0])).toBe(roundKey(list[2]));
  });

  it("names the stage beside the round when there are several stages", () => {
    const list = [m("1", null, 1, "تصفيات"), m("2", "1", 2, "المجموعات")];
    expect(roundsWithLabels(list).map((r) => r.label)).toEqual(["تصفيات", "المجموعات - الجولة 1"]);
  });

  it("games with neither a round nor a stage are the upcoming bucket", () => {
    expect(roundsWithLabels([m("1", null, null, null)])).toEqual([{ key: UNSCHEDULED_ROUND, label: "مباريات قادمة" }]);
  });
});
