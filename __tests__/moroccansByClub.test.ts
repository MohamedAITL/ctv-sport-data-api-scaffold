import { moroccansByClub } from "@/lib/live365";

// The shape of /squads/?competitors=5093,56383 (Morocco, Morocco U23).
const squads = {
  squads: [
    { athletes: [
      { id: 1, name: "أشرف حكيمي", shortName: "حكيمي", clubId: 480, imageVersion: 3 },
      { id: 2, name: "ياسين بونو", shortName: "بونو", clubId: 5457 },
      { id: 3, name: "إبراهيم دياز", shortName: "دياز", clubId: 131 },
    ] },
    { athletes: [
      { id: 3, name: "إبراهيم دياز", shortName: "دياز", clubId: 131 }, // called up by both squads
      { id: 4, name: "لاعب صاعد", clubId: 131 },
      { id: 5, name: "بلا نادٍ" }, // no club: nothing to show him on
    ] },
  ],
};

it("maps each club to its Morocco internationals, each player once", async () => {
  const realFetch = global.fetch;
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => squads })) as unknown as typeof fetch;
  try {
    const byClub = await moroccansByClub();
    expect(byClub.get(480)?.map((p) => p.name)).toEqual(["حكيمي"]);
    expect(byClub.get(131)?.map((p) => p.id)).toEqual([3, 4]);
    expect(byClub.get(480)?.[0].photo).toMatch(/\/v3\/Athletes\/1$/);
    expect(Array.from(byClub.values()).flat()).toHaveLength(4);
  } finally {
    global.fetch = realFetch;
  }
});
