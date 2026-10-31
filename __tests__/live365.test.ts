import { toMatch, pairStats, fetchLiveMatches, fetchLiveDetail, toApiDate, toTopPerformers, toFacts, toShots, fetchPreviousMatches } from "@/lib/live365";

const game = (over: Record<string, unknown> = {}) => ({
  id: 100, sportId: 1, competitionId: 11, competitionDisplayName: "الدوري الإسباني",
  startTime: "2026-10-19T20:00:00+00:00", statusGroup: 3, statusText: "الشوط الأول",
  gameTimeDisplay: "45'",
  homeCompetitor: { id: 140, name: "خيتافي", score: 1, imageVersion: 3 },
  awayCompetitor: { id: 174, name: "رايو", score: 0, imageVersion: 5 },
  ...over,
});

const mock = (fn: (url: string) => unknown) => {
  global.fetch = jest.fn(async (url: string) => ({ ok: true, json: async () => fn(url) })) as unknown as typeof fetch;
};

describe("toMatch", () => {
  it("builds the matchupId that unlocks lineups upstream", () => {
    // /game/ returns no lineups/events without it, and it is never given to us.
    expect(toMatch(game())!.matchupId).toBe("140-174-11");
  });

  it("maps status, clock, scores and crests", () => {
    const m = toMatch(game())!;
    expect(m.isLive).toBe(true);
    expect(m.isFinished).toBe(false);
    expect(m.clock).toBe("45'");
    expect(m.home.score).toBe(1);
    expect(m.home.logo).toContain("/v3/Competitors/140");
    expect(m.home.logo).toContain("d_Competitors:default1.png");
  });

  it("treats -1 as no score yet", () => {
    const m = toMatch(game({ homeCompetitor: { id: 1, name: "a", score: -1 }, awayCompetitor: { id: 2, name: "b", score: -1 } }))!;
    expect(m.home.score).toBeNull();
  });

  it("skips a game with no competitors rather than emitting a broken row", () => {
    expect(toMatch({ id: 1, homeCompetitor: {}, awayCompetitor: {} })).toBeNull();
  });
});

describe("toApiDate", () => {
  // allScores ignores `date=`/`dates=`; only startDate/endDate as DD/MM/YYYY work.
  it("formats an ISO date the way the source expects", () => {
    expect(toApiDate("2026-10-18")).toBe("18/10/2026");
  });
});

describe("fetchLiveMatches", () => {
  const real = global.fetch;
  afterEach(() => { global.fetch = real; });

  it("keeps football only and puts live matches first", async () => {
    mock(() => ({ games: [
      game({ id: 1, statusGroup: 4 }),                       // finished football
      game({ id: 2, sportId: 2 }),                           // basketball — dropped
      game({ id: 3, statusGroup: 2, startTime: "2026-10-19T22:00:00+00:00" }), // upcoming
      game({ id: 4, statusGroup: 3 }),                       // live
    ] }));
    const out = await fetchLiveMatches();
    expect(out.map((m) => m.id)).toEqual([4, 1, 3]);
  });

  // 180+ matches a day are mostly minor leagues. The rail groups by
  // competition, so a competition's matches stay together and the catalog ones
  // lead — live first inside each.
  it("keeps a competition contiguous and puts the catalog ones first", async () => {
    const minor = { competitionId: 99999, competitionDisplayName: "دوري صغير" };
    mock(() => ({ games: [
      game({ id: 1, statusGroup: 3, ...minor }),             // live, minor
      game({ id: 2, statusGroup: 4, ...minor }),             // finished, minor
      game({ id: 3, statusGroup: 4 }),                       // finished, La Liga
      game({ id: 4, statusGroup: 3 }),                       // live, La Liga
    ] }));
    const out = await fetchLiveMatches();
    expect(out.map((m) => m.id)).toEqual([4, 3, 1, 2]);
  });

  // Morocco outranks everything, in any competition.
  it("puts a Moroccan side first even in a foreign competition", async () => {
    const CAF = { competitionId: 624, competitionDisplayName: "دوري أبطال أفريقيا" };
    mock(() => ({
      competitions: [
        { id: 557, countryId: 127, popularityRank: 5000 },   // Botola
        { id: 624, countryId: 19, popularityRank: 300 },     // CAF CL
        { id: 11, countryId: 2, popularityRank: 10 },        // La Liga
        { id: 99999, countryId: 55, popularityRank: 40 },    // a minor league
      ],
      games: [
        game({ id: 1 }),                                                        // La Liga
        game({ id: 2, competitionId: 99999, competitionDisplayName: "صغير" }),  // minor
        game({ id: 3, competitionId: 557, competitionDisplayName: "البطولة" }), // Botola
        // a Moroccan club abroad: the competition itself is not Moroccan
        game({ id: 4, ...CAF, homeCompetitor: { id: 9974, name: "نهضة بركان", countryId: 127, score: 0 } }),
      ],
    }));
    const out = await fetchLiveMatches();
    // Botola and the CAF tie (Moroccan club) lead, then La Liga, then the rest
    expect(out.map((m) => m.id)).toEqual([3, 4, 1, 2]);
  });

  it("leads a competition with its Moroccan tie", async () => {
    const WC = { competitionId: 6085, competitionDisplayName: "كأس العالم للسيدات تحت 17" };
    mock(() => ({
      competitions: [{ id: 6085, countryId: 19, popularityRank: 800 }],
      games: [
        game({ id: 1, ...WC, startTime: "2026-10-20T15:00:00+00:00" }),
        game({ id: 2, ...WC, startTime: "2026-10-20T18:00:00+00:00",
               homeCompetitor: { id: 1700, name: "المغرب تحت 17", countryId: 127, score: 0 } }),
        game({ id: 3, ...WC, startTime: "2026-10-20T12:00:00+00:00" }),
      ],
    }));
    const out = await fetchLiveMatches();
    expect(out.map((m) => m.id)).toEqual([2, 3, 1]); // Morocco first, then by kickoff
  });

  it("treats popularityRank 0 as unranked, not most popular", async () => {
    mock(() => ({
      competitions: [
        { id: 70001, countryId: 9, popularityRank: 0 },      // unranked
        { id: 70002, countryId: 9, popularityRank: 900 },
      ],
      games: [
        game({ id: 1, competitionId: 70001, competitionDisplayName: "بلا تصنيف" }),
        game({ id: 2, competitionId: 70002, competitionDisplayName: "مصنّف" }),
      ],
    }));
    const out = await fetchLiveMatches();
    expect(out.map((m) => m.id)).toEqual([2, 1]);
  });

  it("asks for a past day with startDate/endDate", async () => {
    const seen: string[] = [];
    global.fetch = jest.fn(async (url: string) => {
      seen.push(url);
      return { ok: true, json: async () => ({ games: [] }) };
    }) as unknown as typeof fetch;
    await fetchLiveMatches("2026-10-18");
    expect(seen[0]).toContain("startDate=18%2F10%2F2026");
    expect(seen[0]).toContain("endDate=18%2F10%2F2026");
  });

  it("asks for today when no date is given", async () => {
    const seen: string[] = [];
    global.fetch = jest.fn(async (url: string) => {
      seen.push(url);
      return { ok: true, json: async () => ({ games: [] }) };
    }) as unknown as typeof fetch;
    await fetchLiveMatches();
    expect(seen[0]).not.toContain("startDate");
  });
});

describe("pairStats", () => {
  it("pairs each stat's two team rows into one row", () => {
    const rows = pairStats([
      { id: 10, name: "الاستحواذ", competitorId: 140, value: "60%", valuePercentage: 0.6, isMajor: true },
      { id: 10, name: "الاستحواذ", competitorId: 174, value: "40%", valuePercentage: 0.4, isMajor: true },
    ], 140, 174);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "الاستحواذ", homeValue: "60%", awayValue: "40%", homePercent: 60, awayPercent: 40 });
  });

  it("drops a stat neither side reported", () => {
    expect(pairStats([{ id: 9, name: "x", competitorId: 999, value: "1" }], 140, 174)).toHaveLength(0);
  });
});

describe("fetchLiveDetail", () => {
  const real = global.fetch;
  afterEach(() => { global.fetch = real; });

  const detailPayload = {
    game: game({
      members: [{ id: 5, name: "دافيد سوريا", shortName: "سوريا", jerseyNumber: 13, athleteId: 14641, imageVersion: 64 }],
      events: [{ competitorId: 140, gameTimeDisplay: "25'", playerId: 5, eventType: { name: "بطاقة صفراء" }, isMajor: true, order: 1 }],
      officials: [{ name: "Gustavo Correia" }],
      venue: { name: "ملعب" },
      tvNetworks: [{ name: "beIN 3" }],
      homeCompetitor: {
        id: 140, name: "خيتافي", score: 1, imageVersion: 3,
        lineups: { formation: "4-4-2", hasFieldPositions: true, members: [
          { id: 5, status: 1, position: { name: "حارس مرمى" }, yardFormation: { fieldLine: 0, fieldSide: 50 } },
          { id: 6, status: 2 },
          { id: 7, status: 3 },
          { id: 8, status: 4 },
        ] },
      },
      awayCompetitor: { id: 174, name: "رايو", score: 0, imageVersion: 5 },
    }),
  };

  it("reads the feed's -1 rating as no rating, and its English substitution label in Arabic", async () => {
    const payload = JSON.parse(JSON.stringify(detailPayload));
    payload.game.homeCompetitor.lineups.members[0].ranking = -1;
    payload.game.events[0].eventType.name = "Substitution";
    mock((u) => (u.includes("/game/stats/") ? { statistics: [], statisticsFilters: [] } : payload));
    const d = (await fetchLiveDetail(100, "140-174-11"))!;
    expect(d.homeLineup!.starting[0].rating).toBeNull();
    expect(d.events[0].type).toBe("تبديل");
  });

  it("joins lineup entries to members and splits them by role", async () => {
    mock((u) => (u.includes("/game/stats/")
      ? { statistics: [], statisticsFilters: [{ filterId: -1, name: "المباراة" }] }
      : detailPayload));
    const d = (await fetchLiveDetail(100, "140-174-11"))!;
    const h = d.homeLineup!;
    expect(h.formation).toBe("4-4-2");
    expect(h.starting).toHaveLength(1);
    expect(h.bench).toHaveLength(1);
    expect(h.missing).toHaveLength(1);
    expect(h.coach).not.toBeNull();
    const gk = h.starting[0];
    expect(gk.number).toBe(13);
    expect(gk.shortName).toBe("سوريا");
    expect(gk.photo).toContain("/Athletes/14641");
    // a CDN default keeps a missing photo from 404-ing on the wall display
    expect(gk.photo).toContain("d_Athletes:default.png");
    expect([gk.line, gk.side]).toEqual([0, 50]);
    expect(d.events[0].player).toBe("دافيد سوريا"); // resolved via members
    expect(d.referee).toBe("Gustavo Correia");
  });

  // Verified live: lower-tier leagues publish no lineup at all.
  it("returns a null lineup instead of throwing when none is published", async () => {
    mock((u) => (u.includes("/game/stats/") ? { statistics: [] } : { game: game() }));
    const d = (await fetchLiveDetail(100, "140-174-11"))!;
    expect(d.homeLineup).toBeNull();
    expect(d.awayLineup).toBeNull();
    expect(d.match.home.name).toBe("خيتافي"); // the rest still renders
  });

  it("keeps the lineup when the stats call fails", async () => {
    global.fetch = jest.fn(async (url: string) => {
      if (url.includes("/game/stats/")) return { ok: false, status: 500, json: async () => ({}) };
      return { ok: true, json: async () => detailPayload };
    }) as unknown as typeof fetch;
    const d = (await fetchLiveDetail(100, "140-174-11"))!;
    expect(d.statGroups).toEqual([]);
    expect(d.homeLineup?.starting).toHaveLength(1);
  });
});

describe("toTopPerformers", () => {
  // Verified on a real "لم تبدأ" game (Guadalajara–Necaxa): /game/stats/ has no
  // `statistics` key at all before kickoff, but /game/ already carries this.
  const raw = {
    categories: [
      {
        name: "الهجوم",
        homePlayer: {
          id: 499173, athleteId: 9098, name: "أنجيل سيبولفيدا", imageVersion: 29,
          positionName: "المهاجم الصريح",
          stats: [{ type: 1, name: "اهداف", value: "1" }, { type: 5, name: "المشاركات", value: "11" }],
        },
        awayPlayer: { id: 5486695, athleteId: 53046, name: "جوليان كارانزا", imageVersion: 37, stats: [] },
      },
      { name: "الوسط" },
    ],
  };

  it("pairs each category and builds photo URLs with the 404 guard", () => {
    const rows = toTopPerformers(raw);
    expect(rows).toHaveLength(1); // the category with no players is dropped
    expect(rows[0].name).toBe("الهجوم");
    expect(rows[0].home!.photo).toContain("/v29/Athletes/9098");
    expect(rows[0].home!.photo).toContain("d_Athletes:default.png");
    expect(rows[0].home!.stats).toEqual([
      { name: "اهداف", value: "1" },
      { name: "المشاركات", value: "11" },
    ]);
    expect(rows[0].away!.position).toBeNull();
  });

  it("is empty when the source publishes none", () => {
    expect(toTopPerformers(undefined)).toEqual([]);
    expect(toTopPerformers({})).toEqual([]);
  });
});

describe("statGroups", () => {
  // The default response is the whole match; every other period the source
  // advertises is its own call, which is the half-time data the UI was missing.
  const stat = (id: number, name: string, home: string, away: string) => ([
    { id, name, competitorId: 140, value: home, valuePercentage: 0.6, isMajor: true },
    { id, name, competitorId: 174, value: away, valuePercentage: 0.4, isMajor: true },
  ]);

  it("fetches every published period and labels them", async () => {
    const calls: string[] = [];
    global.fetch = jest.fn(async (url: string) => {
      calls.push(url);
      if (url.includes("filterId=6")) return { ok: true, json: async () => ({ statistics: stat(10, "الاستحواذ", "68%", "32%") }) };
      if (url.includes("/game/stats/")) {
        return { ok: true, json: async () => ({
          statistics: stat(10, "الاستحواذ", "66%", "34%"),
          statisticsFilters: [{ filterId: -1, name: "المباراة" }, { filterId: 6, name: "الشوط الأول" }],
        }) };
      }
      return { ok: true, json: async () => ({ game: { id: 100, sportId: 1, competitionId: 11, statusGroup: 3,
        homeCompetitor: { id: 140, name: "خيتافي" }, awayCompetitor: { id: 174, name: "رايو" } } }) };
    }) as unknown as typeof fetch;

    const d = (await fetchLiveDetail(100, "140-174-11"))!;
    expect(d.statGroups.map((g) => g.name)).toEqual(["المباراة", "الشوط الأول"]);
    expect(d.statGroups[0].rows[0].homeValue).toBe("66%");
    expect(d.statGroups[1].rows[0].homeValue).toBe("68%");
    expect(calls.filter((c) => c.includes("filterId=")).length).toBe(1); // only the extra period
  });
});

describe("toFacts", () => {
  it("maps the ball-in-play block the stats tab now shows", () => {
    const facts = toFacts({
      actualPlayTime: { title: "وقت اللعب الفعلي", actualTime: { name: "لُعِبَ بالفعل 48:55" }, totalTime: { name: "الوقت الاجمالي 86:05" } },
      general: [{ name: "فحوصات VAR مهمة", value: "04:29" }],
      addedTime: { title: "وقت إضافي", stats: [{ name: "مُعلَن", value: "02:00" }] },
      // the source splits time wasted per team under the SAME name
      wastedTime: { title: "وقت ضائع", stats: [
        { name: "ركنيات", competitorId: 140, value: "03:40" },
        { name: "ركنيات", competitorId: 174, value: "01:12" },
      ] },
    }, 140, 174);
    expect(facts.map((f) => f.title)).toEqual(["وقت اللعب الفعلي", "وقت إضافي", "وقت ضائع", "تفاصيل"]);
    // a per-team figure becomes one row with both sides, not two rows
    expect(facts[2].rows).toEqual([{ name: "ركنيات", value: "03:40", away: "01:12" }]);
    // the figure lives at the tail of the label, not in a value field
    expect(facts[0].rows).toEqual([
      { name: "لُعِبَ بالفعل", value: "48:55" },
      { name: "الوقت الاجمالي", value: "86:05" },
    ]);
    expect(facts[1].rows).toEqual([{ name: "مُعلَن", value: "02:00" }]);
  });

  it("is empty when the source publishes none (a finished Botola game)", () => {
    expect(toFacts(undefined, 140, 174)).toEqual([]);
  });
});

describe("toShots", () => {
  // Verified against Spurs 3-1 Coventry: `status` is the period (6 = first
  // half), and the goal marker is outcome.id 0 — reading `status` as the
  // result flagged all 29 shots as goals.
  const members = [{ id: 11, name: "جيمس ماديسون" }, { id: 12, name: "تايوو أونيي" }];
  const chart = {
    events: [
      { competitorNum: 1, time: "14'", playerId: 11, status: 6, xg: "0.05", xgot: "0.64",
        bodyPart: "القدم اليمنى", goalDescription: "أعلى الجهة اليسرى", outcome: { id: 0, name: "هدف" } },
      { competitorNum: 2, time: "85'", playerId: 12, status: 8, xg: "0.04", xgot: "0.00",
        outcome: { id: 1, name: "خارج المرمى" } },
    ],
  };

  it("marks only the goal, and resolves the shooter", () => {
    const shots = toShots(chart, members);
    expect(shots.map((s) => s.isGoal)).toEqual([true, false]);
    expect(shots[0].player).toBe("جيمس ماديسون");
    expect(shots[0].home).toBe(true);
    expect(shots[0].xg).toBe("0.05");
    expect(shots[1].home).toBe(false);
    expect(shots[1].outcome).toBe("خارج المرمى");
  });

  it("is empty when the source charts no shots", () => {
    expect(toShots(undefined, members)).toEqual([]);
  });
});

describe("fetchPreviousMatches", () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  // The meetings come from /games/h2h/, the endpoint 365scores' own match page
  // uses. Earlier attempts guessed `games=`/`competitors=` and got 404/500; the
  // parameters are gameId AND matchupId. For PSG v Barcelona it answers with
  // fifteen meetings back to 2017 — a results feed reaches a couple of months.
  const meeting = (id: number, date: string, homeId: number, hs: number, awayId: number, as: number) => ({
    id, startTime: `${date}T19:00:00+00:00`, competitionDisplayName: "دوري أبطال اوروبا",
    homeCompetitor: { id: homeId, name: homeId === 480 ? "باريس سان جيرمان" : "برشلونة", score: hs },
    awayCompetitor: { id: awayId, name: awayId === 480 ? "باريس سان جيرمان" : "برشلونة", score: as },
  });

  it("reads the head-to-head endpoint and counts the record from both sides", async () => {
    const seen: string[] = [];
    global.fetch = jest.fn(async (url: string) => {
      seen.push(url);
      if (url.includes("/games/h2h/")) {
        return { ok: true, json: async () => ({ game: { h2hGames: [
          meeting(4828461, "2026-10-20", 480, 4, 132, 2), // the tie being watched
          meeting(1, "2025-10-01", 132, 1, 480, 2),       // Barcelona lost at home
          meeting(2, "2021-03-10", 480, 1, 132, 1),       // draw
          meeting(3, "2017-03-08", 132, 6, 480, 1),       // Barcelona won
        ] } }) };
      }
      return { ok: true, json: async () => ({ games: [] }) };
    }) as unknown as typeof fetch;

    const out = await fetchPreviousMatches(4828461, "480-132-572", 480, 132);
    // the match on screen is not one of its own previous meetings
    expect(out.h2h.map((m) => m.id)).toEqual([1, 2, 3]);
    expect(out.record).toEqual({ played: 3, homeWins: 1, draws: 1, awayWins: 1, homeGoals: 4, awayGoals: 8 });
    expect(seen.some((u) => u.includes("/games/h2h/") && u.includes("gameId=4828461") && u.includes("matchupId=480-132-572"))).toBe(true);
  });

  it("reports an empty record for two sides that have never met", async () => {
    global.fetch = jest.fn(async (url: string) => ({
      ok: true,
      json: async () => (url.includes("/games/h2h/") ? { game: { h2hGames: [] } } : { games: [] }),
    })) as unknown as typeof fetch;
    const out = await fetchPreviousMatches(1, "1-2-3", 1, 2);
    expect(out.h2h).toEqual([]);
    expect(out.record.played).toBe(0);
  });
});
