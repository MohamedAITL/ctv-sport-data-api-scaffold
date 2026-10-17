import { validateStandings } from "@/lib/validate";
import type { TeamRow } from "@/types/standings";

const row = (p: Partial<TeamRow>): TeamRow => ({
  rank: 1, teamId: "t", nameOriginal: "T", nameAr: "ت", played: 4, wins: 2,
  draws: 1, losses: 1, gf: 5, ga: 4, points: 7, logo: "x", promotion: null, ...p,
});

describe("validateStandings", () => {
  it("rejects empty standings", () => {
    const r = validateStandings([]);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/empty/);
  });

  it("rejects duplicate teams and missing team id", () => {
    const r = validateStandings([row({ teamId: "a", rank: 1 }), row({ teamId: "a", rank: 2 })], 2);
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/twice/);
    const r2 = validateStandings([row({ teamId: "" })], 1);
    expect(r2.ok).toBe(false);
    expect(r2.errors.join(" ")).toMatch(/no team id/);
  });

  it("rejects non-numeric stats", () => {
    const r = validateStandings([row({ points: NaN })], 1);
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/invalid points/);
  });

  it("warns on wins>played and unexpected count but stays ok", () => {
    const r = validateStandings([row({ teamId: "a", wins: 9, played: 2 })], 16);
    expect(r.ok).toBe(true);
    expect(r.warnings.join(" ")).toMatch(/wins .* > played/);
    expect(r.warnings.join(" ")).toMatch(/expected 16/);
  });
});
