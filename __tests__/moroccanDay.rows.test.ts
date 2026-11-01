import { addUpWeek, dayLine, hasPlayed, roleLabel, sortRows, toMoroccanRows, weekLine, type MoroccanDayRow } from "@/lib/moroccanDay";
import type { LineupPlayer, LiveMatch, MatchSheet, TeamLineup } from "@/types/live";

const match = (over: Partial<LiveMatch> = {}): LiveMatch => ({
  id: 9, matchupId: "1-2-3", competitionId: 3, competition: "الدوري الفرنسي", competitionLogo: null,
  startTime: "2026-11-01T14:00:00Z", statusText: "انتهت", clock: "", isLive: false, isFinished: true,
  home: { id: 1, name: "ليل", score: 2, logo: "l" }, away: { id: 2, name: "لانس", score: 1, logo: "r" }, ...over,
});
const player = (athleteId: number, over: Partial<LineupPlayer> = {}): LineupPlayer => ({
  id: athleteId + 1000, athleteId, name: "", shortName: "", number: null, photo: null, position: null, role: "starting",
  rating: 7.4, topStats: [], line: null, side: null,
  stats: [{ name: "الدقائق", value: "90'" }, { name: "الأهداف", value: "1" }, { name: "صناعة", value: "2" }, { name: "صناعة فرص", value: "5" }],
  ...over,
});
const lineup = (over: Partial<TeamLineup> = {}): TeamLineup => ({ formation: null, hasFieldPositions: false, starting: [], bench: [], missing: [], coach: null, ...over });
const sheet = (home: TeamLineup, over: Partial<MatchSheet> = {}): MatchSheet => ({ home, away: lineup(), homeConfirmed: true, awayConfirmed: true, cards: [], ...over });
const moroccan = (id: number) => ({ id, name: `لاعب ${id}`, photo: `p${id}` });
const row = (m = match(), s: MatchSheet | null = null, id = 5) => toMoroccanRows("2026-11-01", m, s, [moroccan(id)], [])[0];

describe("toMoroccanRows", () => {
  it("reads a starter's day from his lineup entry", () => {
    expect(row(match(), sheet(lineup({ starting: [player(5)] })))).toMatchObject({
      role: "starting", minutes: 90, goals: 1, assists: 2, rating: 7.4, club: "ليل", opponent: "لانس", score: { for: 2, against: 1 },
    });
  });
  it("does not read key passes as assists", () => {
    const p = player(5, { stats: [{ name: "صناعة فرص", value: "5" }] });
    expect(row(match(), sheet(lineup({ starting: [p] }))).assists).toBe(0);
  });
  it("tells a substitute who came on from one who did not", () => {
    const on = row(match(), sheet(lineup({ bench: [player(5, { subbedIn: { replaces: 1, minute: 63 } })] })));
    expect(on).toMatchObject({ role: "came_on", cameOn: 63 });
    expect(row(match(), sheet(lineup({ bench: [player(5, { stats: [] })] }))).role).toBe("bench");
  });
  it("knows a missing player, and one left out of the squad", () => {
    expect(row(match(), sheet(lineup({ missing: [player(5)] }))).role).toBe("missing");
    expect(row(match(), sheet(lineup({ starting: [player(7)] }))).role).toBe("out");
  });
  it("never trusts a predicted lineup", () => {
    expect(row(match(), sheet(lineup({ starting: [player(5)] }), { homeConfirmed: false }))).toMatchObject({ role: "unknown", minutes: 0, goals: 0 });
  });
  it("copes with no lineup at all, and no sheet", () => {
    expect(row(match(), { home: null, away: null, homeConfirmed: false, awayConfirmed: false, cards: [] }).role).toBe("unknown");
    expect(row().role).toBe("unknown");
  });
  it("gives an away player his own side of the score", () => {
    const r = toMoroccanRows("2026-11-01", match(), { home: lineup(), away: lineup({ starting: [player(5)] }), homeConfirmed: true, awayConfirmed: true, cards: [] }, [], [moroccan(5)])[0];
    expect(r).toMatchObject({ club: "لانس", opponent: "ليل", score: { for: 1, against: 2 } });
  });
  it("counts his cards by member id", () => {
    const r = row(match(), sheet(lineup({ starting: [player(5)] }), { cards: [{ playerId: 1005, red: false }, { playerId: 1005, red: true }, { playerId: 1, red: true }] }));
    expect(r).toMatchObject({ yellow: 1, red: 1 });
  });
  it("has no score before kickoff", () => {
    const m = match({ isFinished: false, home: { id: 1, name: "ليل", score: null, logo: null }, away: { id: 2, name: "لانس", score: null, logo: null } });
    expect(row(m).score).toBeNull();
  });
});

const base = row(match(), sheet(lineup({ starting: [player(5)] })));
const r = (over: Partial<MoroccanDayRow>): MoroccanDayRow => ({ ...base, ...over });

describe("before kickoff", () => {
  const soon = match({ isFinished: false, home: { id: 1, name: "ليل", score: null, logo: null }, away: { id: 2, name: "لانس", score: null, logo: null } });
  const named = row(soon, sheet(lineup({ starting: [player(5, { rating: 6.2, stats: [] })] })));
  it("a confirmed starter has not played, and has no match rating", () => {
    expect(named).toMatchObject({ role: "starting", rating: null });
    expect(hasPlayed(named)).toBe(false);
  });
  it("says he is starting rather than showing nothing", () => {
    expect(dayLine(named)).toMatchObject({ meta: "ليل × لانس", chips: ["أساسي"] });
  });
  it("is left out of the week", () => expect(addUpWeek([[named]])).toEqual([]));
});

describe("sortRows", () => {
  it("puts live players first, then goals, then rating, unknowns and benched last", () => {
    const rows = [
      r({ key: "bench", role: "bench" }),
      r({ key: "rated", goals: 0, assists: 0, rating: 8 }),
      r({ key: "scorer", goals: 2 }),
      r({ key: "unknown", role: "unknown" }),
      r({ key: "live", isLive: true, goals: 0, assists: 0 }),
    ];
    expect(sortRows(rows).map((x) => x.key)).toEqual(["live", "scorer", "rated", "unknown", "bench"]);
  });
});

describe("addUpWeek", () => {
  const a = r({ key: "1-5", date: "2026-10-30", goals: 1, assists: 0, minutes: 90, rating: 7 });
  const b = r({ key: "2-5", date: "2026-11-01", goals: 2, assists: 1, minutes: 70, rating: 8, yellow: 1 });
  it("adds a player's matches and averages his rating", () => {
    expect(addUpWeek([[a], [b]])[0]).toMatchObject({ matches: 2, goals: 3, assists: 1, minutes: 160, yellow: 1, rating: 7.5, source: { date: "2026-11-01", key: "2-5" } });
  });
  it("leaves out matches he did not play", () => {
    expect(addUpWeek([[r({ role: "bench" })], [r({ role: "unknown" })]])).toEqual([]);
  });
  it("copes with no ratings", () => expect(addUpWeek([[r({ rating: null })]])[0].rating).toBeNull());
  it("ranks the week's scorers first", () => {
    const other = r({ playerId: 6, key: "3-6", goals: 5, assists: 0 });
    expect(addUpWeek([[a, other]]).map((x) => x.playerId)).toEqual([6, 5]);
  });
});

describe("words", () => {
  it("does not say a benched player is still waiting once the match is over", () => {
    expect(roleLabel({ role: "bench", cameOn: null, isFinished: true })).toBe("لم يشارك");
    expect(roleLabel({ role: "bench", cameOn: null, isFinished: false })).toBe("على الدكة");
    expect(roleLabel({ role: "came_on", cameOn: 63, isFinished: true })).toBe("بديل د 63");
    expect(roleLabel({ role: "unknown", cameOn: null, isFinished: false })).toBe("لم تُعلن التشكيلة");
  });
  it("a played match shows figures, one not played shows why", () => {
    expect(dayLine(base)).toMatchObject({ meta: "ليل 2-1 لانس", chips: ["هدف", "صناعتان", "تقييم 7.4"] });
    expect(dayLine(r({ role: "out" })).chips).toEqual(["خارج القائمة"]);
    expect(hasPlayed(r({ role: "missing" }))).toBe(false);
  });
  it("counts in natural Arabic", () => {
    expect(dayLine(r({ goals: 2, assists: 1, rating: null, minutes: 0 })).chips).toEqual(["هدفان", "صناعة هدف"]);
    expect(dayLine(r({ goals: 3, assists: 3, rating: null, minutes: 0 })).chips).toEqual(["3 أهداف", "3 صناعات"]);
  });
  it("a week line says how much he played", () => {
    const [w] = addUpWeek([[r({ goals: 0, assists: 0, minutes: 90, rating: null })]]);
    expect(weekLine(w)).toMatchObject({ meta: "ليل · مباراة واحدة · 90 دقيقة", chips: [] });
  });
});
