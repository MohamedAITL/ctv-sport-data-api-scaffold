import { fetch365Standings } from "@/lib/scores365";

// Minimal 365scores standings payload (shape verified live 2026-10-18).
const payload = {
  standings: [
    {
      seasonNum: 84,
      rows: [
        {
          position: 2,
          gamePlayed: 4,
          gamesWon: 2,
          gamesEven: 1,
          gamesLost: 1,
          for: 7,
          against: 3,
          points: 7,
          competitor: { id: 8677, name: "النادي المكناسي", imageVersion: 1 },
        },
        {
          position: 1,
          gamePlayed: 4,
          gamesWon: 3,
          gamesEven: 0,
          gamesLost: 1,
          for: 6,
          against: 4,
          points: 9,
          competitor: { id: 8209, name: "الكوكب المراكشي", imageVersion: 2 },
        },
      ],
    },
  ],
};

describe("fetch365Standings", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it("maps 365scores rows to TeamRow, sorted by rank, with Arabic names and logo URLs", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => payload })) as unknown as typeof fetch;

    const { rows } = await fetch365Standings(557);

    expect(rows).toHaveLength(2);
    // Sorted by position: Kawkab (1) before Meknassi (2).
    expect(rows[0].rank).toBe(1);
    expect(rows[0].nameAr).toBe("الكوكب المراكشي");
    expect(rows[0].played).toBe(4);
    expect(rows[0].wins).toBe(3);
    expect(rows[0].draws).toBe(0);
    expect(rows[0].points).toBe(9);
    // Logo URL carries the competitor id + imageVersion.
    expect(rows[0].logo).toContain("/v2/Competitors/8209");
    expect(rows[1].rank).toBe(2);
  });

  it("prefers a saved Arabic-name override over the 365scores name", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => payload })) as unknown as typeof fetch;
    const { rows } = await fetch365Standings(557, { "8209": "كوكب مراكش" });
    expect(rows[0].nameAr).toBe("كوكب مراكش");
  });

  it("throws on a non-ok response so the caller can fall back", async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 403, json: async () => ({}) })) as unknown as typeof fetch;
    await expect(fetch365Standings(557)).rejects.toThrow("365scores 403");
  });
});
