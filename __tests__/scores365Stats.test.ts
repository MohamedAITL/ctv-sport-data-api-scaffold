import { fetch365Stats } from "@/lib/scores365Stats";

// Shapes verified live against 365scores on 2026-10-19.
const payload = {
  stats: {
    athletesStats: [
      {
        id: 1,
        name: "الأهداف",
        rows: [
          {
            position: 0, // 365scores sends 0 for the leader in this block
            secondaryStatName: "ضربات الجزاء المسجلة: 1",
            entity: { id: 92080, name: "عبدالرزاق الناقوس", competitorId: 8203 },
            // statsTypes on the block are unreliable; the first value is the one shown
            stats: [{ typeId: 1, value: "5" }, { typeId: 10, value: "1" }],
          },
          {
            position: 2,
            entity: { id: 105847, name: "عماد الرياحي", competitorId: 8326 },
            stats: [{ typeId: 1, value: "4" }],
          },
        ],
        statsTypes: [{ typeId: 3, name: "بطاقات صفراء" }],
      },
    ],
    competitorsStats: [
      {
        id: 1,
        name: "أهداف للمباراة الواحدة",
        averageStat: { text: "المعدل لكل فريق", value: "1.30" },
        rows: [
          {
            position: 1,
            secondaryStatName: "إجمالي الأهداف المسجلة: 11",
            entity: { id: 8203, name: "الدفاع الحسني الجديدي", competitorId: 8203 },
            stats: [{ typeId: 3, value: "2.75" }],
          },
        ],
      },
    ],
  },
};

describe("fetch365Stats", () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });
  const mock = () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => payload })) as unknown as typeof fetch;
  };

  it("returns player and team categories with Arabic names", async () => {
    mock();
    const cats = await fetch365Stats(557);
    expect(cats.map((c) => c.kind)).toEqual(["player", "team"]);
    expect(cats[0].name).toBe("الأهداف");
    expect(cats[1].name).toBe("أهداف للمباراة الواحدة");
  });

  it("takes the displayed value from stats[0], not from statsTypes", async () => {
    mock();
    const [goals] = await fetch365Stats(557);
    expect(goals.rows[0].value).toBe("5");
    expect(goals.rows[0].name).toBe("عبدالرزاق الناقوس");
    expect(goals.rows[0].secondary).toBe("ضربات الجزاء المسجلة: 1");
  });

  it("ranks a leader sent with position 0 as rank 1", async () => {
    mock();
    const [goals] = await fetch365Stats(557);
    expect(goals.rows.map((r) => r.rank)).toEqual([1, 2]);
  });

  it("uses an Athlete photo for players and a Competitor crest for teams", async () => {
    mock();
    const [players, teams] = await fetch365Stats(557);
    expect(players.rows[0].image).toContain("/Athletes/92080");
    expect(players.rows[0].clubImage).toContain("/Competitors/8203");
    expect(teams.rows[0].image).toContain("/Competitors/8203");
    expect(teams.rows[0].clubImage).toBeNull();
  });

  it("carries the league average for team categories", async () => {
    mock();
    const [, teams] = await fetch365Stats(557);
    expect(teams.average).toEqual({ text: "المعدل لكل فريق", value: "1.30" });
  });

  it("throws on a non-ok response so the route can report it", async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })) as unknown as typeof fetch;
    await expect(fetch365Stats(557)).rejects.toThrow("365scores stats 503");
  });
});
