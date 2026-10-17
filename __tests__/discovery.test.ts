import { discoverBotola } from "@/lib/discovery";
import { goalFetch } from "../lib/goalApi";

jest.mock("../lib/goalApi", () => ({
  goalFetch: jest.fn(),
  GoalApiError: class extends Error {},
}));

const mockFetch = goalFetch as jest.MockedFunction<typeof goalFetch>;

describe("discoverBotola", () => {
  beforeEach(() => mockFetch.mockReset());

  it("verifies the id hint when it is really Botola Pro", async () => {
    mockFetch.mockImplementation(async (path: string) => {
      if (path.startsWith("/leagues/"))
        return { data: { id: "HINT", name: "Botola Pro", countryName: "Morocco", season: "2026/2027", _count: { standings: 16 } } } as never;
      throw new Error("unexpected " + path);
    });
    const league = await discoverBotola();
    expect(league.id).toBe("HINT");
    expect(league.season).toBe("2026/2027");
  });

  it("resolves Morocco Botola via countries, not the first league returned", async () => {
    mockFetch.mockImplementation(async (path: string) => {
      if (path === "/leagues/cmr77dw7800g9rx06v6a4zya0") return { data: { id: "old", name: "Some Old Cup" } } as never; // hint not Botola -> rejected
      if (path === "/countries") return { data: [{ id: "fr", name: "France" }, { id: "ma", name: "Morocco" }] } as never;
      if (path === "/countries/ma/leagues") return { data: [{ id: "x", name: "Moroccan Cup" }, { id: "b", name: "Botola Pro" }] } as never;
      if (path === "/leagues/b") return { data: { id: "b", name: "Botola Pro", countryName: "Morocco", season: "2026/2027", _count: { standings: 16 } } } as never;
      throw new Error("unexpected " + path);
    });
    const league = await discoverBotola();
    expect(league.id).toBe("b"); // not "x" (first) and not "old" (bad hint)
    expect(league.name).toBe("Botola Pro");
  });

  it("throws rather than guessing when nothing matches", async () => {
    mockFetch.mockResolvedValue({ data: [] } as never);
    await expect(discoverBotola()).rejects.toThrow(/Botola Pro/);
  });
});
