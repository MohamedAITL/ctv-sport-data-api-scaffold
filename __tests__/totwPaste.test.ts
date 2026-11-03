import { matchPasted } from "@/lib/totwPaste";
import { formationSlots, type TotwPlayer } from "@/lib/totw";
import pool from "./fixtures/botolaRound6Pool.json";

// Botola round 6, as the app reads it: 246 players, starters and substitutes who came on.
const players = pool as TotwPlayer[];
const id = (slug: string) => (players.find((p) => p.slug === slug) as TotwPlayer).id;

// A team as it is copied from a page: header lines, then each player's rating above his name.
const TEAM: Array<[string, string]> = [
  ["7.9", "M. El Kajoui"], ["7.4", "H. El Moussaoui"], ["7.1", "I. Kandouss"], ["7.6", "J. Harkass"], ["7.0", "H. Manout"],
  ["7.3", "Y. Labhiri"], ["8.2", "A. Lamirat"], ["7.2", "Ayoub Khairi"], ["8.0", "M. Chouiar"], ["8.6", "O. Lamlioui"], ["7.8", "R. Mendes"],
];
const paste = (rows: Array<[string, string]>) => ["Team of the Week", "Botola Pro", "Round 6", ...rows.flatMap(([r, n]) => [r, n])].join("\n");

describe("a pasted team of the round", () => {
  const out = matchPasted(paste(TEAM), players);

  it("finds all eleven among the round's players, and reads the formation off their positions", () => {
    expect(out.found).toBe(11);
    expect(out.formation).toBe("4-3-3");
    expect(out.missed).toEqual([]);
  });

  it("puts the keeper in goal and the back four from their own left to right", () => {
    const spots = formationSlots("4-3-3");
    expect(out.slots[0]).toBe(id("munir-el-kajoui"));
    const back = spots.map((s, i) => ({ ...s, i })).filter((s) => s.line === spots[1].line).sort((a, b) => a.side - b.side);
    expect(back.map((s) => out.slots[s.i])).toEqual(["el-moussaoui", "ismael-kandouss", "j.-harkass", "haytam-manout"].map(id));
  });

  it("finds a substitute who came on", () => {
    expect(Object.values(out.slots)).toContain(id("ryan-mendes"));
  });

  it("reads each player's rating, and never a shirt number", () => {
    expect(out.ratings[id("oussama-lamlioui")]).toBe(8.6);
    expect(out.ratings[id("munir-el-kajoui")]).toBe(7.9);
    const shirt = matchPasted("10\nO. Lamlioui", players);
    expect(shirt.ratings[id("oussama-lamlioui")]).toBeUndefined();
  });

  it("does not care about the order of the paste", () => {
    const shuffled = matchPasted(paste([...TEAM].reverse()), players);
    expect(shuffled.slots).toEqual(out.slots);
  });

  it("reads Arabic names too", () => {
    const ar = matchPasted("منير المحمدي\nأسامة المليوي\nحمزة الموساوي", players);
    expect(Object.values(ar.slots).sort()).toEqual([id("munir-el-kajoui"), id("oussama-lamlioui"), id("el-moussaoui")].sort());
  });

  it("settles a shared surname with the initial, and leaves a true tie to be picked by hand", () => {
    expect(Object.values(matchPasted("A. El Khafi", players).slots)).toEqual([id("ayoub-el-khafi")]);
    const tie = matchPasted("A. Khairi", players);
    expect(tie.found).toBe(0);
    expect(tie.missed).toEqual(["A. Khairi"]);
  });

  it("fills what it found into the current formation when some are missing", () => {
    const part = matchPasted(paste(TEAM.slice(0, 6)), players, "4-4-2");
    expect(part.formation).toBe("4-4-2");
    expect(part.found).toBe(6);
    expect(part.slots[0]).toBe(id("munir-el-kajoui"));
  });

  it("ignores a paste with no players in it, and never echoes the page's own name", () => {
    expect(matchPasted("Team of the Week\nRound 6\nBotola Pro", players)).toMatchObject({ found: 0, missed: [] });
    expect(matchPasted("Sofascore\nTeam of the Round provided by Sofascore\nRating\n8.6\nO. Lamlioui", players)).toMatchObject({ found: 1, missed: [] });
  });
});
