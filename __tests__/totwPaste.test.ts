import { embedSrc, matchPasted } from "@/lib/totwPaste";
import { formationSlots, type TotwPlayer } from "@/lib/totw";
import fs from "fs";
import path from "path";
import pool from "./fixtures/botolaRound6Pool.json";

// Botola round 6, as the app reads it: 246 players, starters and substitutes who came on.
const players = pool as TotwPlayer[];
const id = (slug: string) => (players.find((p) => p.slug === slug) as TotwPlayer).id;

// A team typed as a list: header lines, each player's rating above his name, each row right to left.
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

  it("puts the keeper in goal and reads each row right to left", () => {
    const spots = formationSlots("4-3-3");
    expect(out.slots[0]).toBe(id("munir-el-kajoui"));
    const back = spots.map((s, i) => ({ ...s, i })).filter((s) => s.line === spots[1].line).sort((a, b) => a.side - b.side);
    expect(back.map((s) => out.slots[s.i])).toEqual(["haytam-manout", "j.-harkass", "ismael-kandouss", "el-moussaoui"].map(id));
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

  it("takes each player's row from his position, whatever order the lines come in", () => {
    const reversed = matchPasted(paste([...TEAM].reverse()), players);
    const rows = (r: typeof out) => formationSlots(r.formation).map((s, i) => [s.line, r.slots[i]] as const)
      .reduce((m, [line, pid]) => m.set(line, [...(m.get(line) ?? []), pid].sort()), new Map<number, number[]>());
    expect(rows(reversed)).toEqual(rows(out));
  });

  it("reads Arabic names too", () => {
    const ar = matchPasted("منير المحمدي\nأسامة المليوي\nحمزة الموساوي", players);
    expect(Object.values(ar.slots).sort()).toEqual([id("munir-el-kajoui"), id("oussama-lamlioui"), id("el-moussaoui")].sort());
  });

  it("settles a shared surname with the initial, and leaves a true tie to be picked by hand", () => {
    expect(Object.values(matchPasted("A. El Khafi", players).slots)).toEqual([id("ayoub-el-khafi")]);
    // Our data's Latin name for يوسف مهري is "a.-khairi": his Arabic first name says Y, so "A." is Ayoub.
    expect(Object.values(matchPasted("A. Khairi", players).slots)).toEqual([id("ayoub-khairi")]);
    const tie = matchPasted("Khafi", players);
    expect(tie.found).toBe(0);
    expect(tie.missed).toEqual(["Khafi"]);
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

describe("an embed code", () => {
  const CODE = `<iframe id="x" width="100%" height="598" src="https://widgets.example.com/en/embed/unique-tournament/937/season/102220/round/30347/teamOfTheWeek?showCompetitionLogo=true&amp;widgetTheme=light" frameBorder="0"></iframe>`;

  it("gives the widget's address, from the whole tag or the address alone", () => {
    expect(embedSrc(CODE)).toBe("https://widgets.example.com/en/embed/unique-tournament/937/season/102220/round/30347/teamOfTheWeek?showCompetitionLogo=true&widgetTheme=light");
    expect(embedSrc("https://widgets.example.com/en/embed/x")).toBe("https://widgets.example.com/en/embed/x");
  });

  it("refuses anything that is not a secure embed page", () => {
    expect(embedSrc("hello")).toBeNull();
    expect(embedSrc('<iframe src="http://widgets.example.com/en/embed/x">')).toBeNull();
    expect(embedSrc('<iframe src="javascript:alert(1)">')).toBeNull();
    expect(embedSrc("https://example.com/page")).toBeNull();
  });
});

// Exactly what Ctrl+A, Ctrl+C gives inside the real widget for Botola round 6:
// full name, club, short name, keeper first, each row right to left. No ratings.
describe("the real team of the round, copied from the widget", () => {
  const COPY = fs.readFileSync(path.join(__dirname, "fixtures/botolaRound6Widget.txt"), "utf8");
  const out = matchPasted(COPY, players);
  const spots = formationSlots(out.formation).map((s, i) => ({ ...s, i }));
  const row = (line: number) => spots.filter((s) => s.line === line).sort((a, b) => a.side - b.side).map((s) => out.slots[s.i]);
  const lines = Array.from(new Set(spots.slice(1).map((s) => s.line))).sort((a, b) => a - b);

  it("finds all eleven, and takes the club lines as clubs, never as missing players", () => {
    expect(out).toMatchObject({ found: 11, formation: "4-3-3", missed: [] });
  });

  it("reads Rhabra as غبرة and Mehri by his Arabic name", () => {
    expect(Object.values(out.slots)).toEqual(expect.arrayContaining([id("jawad-ghabra"), id("a.-khairi")]));
  });

  it("lays each row out as the widget draws it, left to right on the poster", () => {
    expect(out.slots[0]).toBe(id("amine-el-ouaad"));
    expect(row(lines[0])).toEqual(["issoufou-dayo", "ismail-el-alami", "hamza-smaali", "mohamed-moufid"].map(id));
    expect(row(lines[1])).toEqual(["yassine-labhiri", "anas-serrhat", "abdessamad-mahir"].map(id));
    expect(row(lines[2])).toEqual(["mounir-chouiar", "jawad-ghabra", "a.-khairi"].map(id));
  });

  it("brings no ratings: the widget does not let them be copied", () => {
    expect(out.ratings).toEqual({});
  });

  it("uses the club beside a name to pick between namesakes", () => {
    // Two players are "Khafi": alone the name is a tie; with a club line it is not.
    const club = (slug: string) => (players.find((p) => p.slug === slug) as TotwPlayer).club?.slug?.replace(/-/g, " ") ?? "";
    expect(matchPasted("Khafi", players).found).toBe(0);
    expect(Object.values(matchPasted(`Khafi\n${club("ismail-khafi")}`, players).slots)).toEqual([id("ismail-khafi")]);
    expect(Object.values(matchPasted(`Khafi\n${club("ayoub-el-khafi")}`, players).slots)).toEqual([id("ayoub-el-khafi")]);
  });
});
