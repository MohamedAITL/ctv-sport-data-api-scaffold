import { h2hTitles, lineupTitles, resultTitles, statsTitles } from "@/lib/liveTitles";
import type { Goal, H2HRecord, PastMatch, StatRow, TeamLineup } from "@/types/live";

const match = (home: number, away: number, over: object = {}) => ({
  home: { name: "الوداد", score: home }, away: { name: "الرجاء", score: away },
  competition: "المغرب, الدوري المغربي", isLive: false, isFinished: true, statusText: "انتهت", clock: "", ...over,
}) as Parameters<typeof resultTitles>[0];

const goal = (player: string, home: boolean, order: number, kind: Goal["kind"] = "field"): Goal =>
  ({ order, home, minute: "10'", player, photo: null, kind, score: { home: 0, away: 0 } });

const lineup = (formation: string | null, coach: string | null) =>
  ({ formation, coach: coach ? { name: coach } : null }) as unknown as TeamLineup;

describe("result titles", () => {
  it("names both teams and the score from the winner's side, in every title", () => {
    for (const m of [match(1, 3), match(3, 1)]) {
      for (const title of resultTitles(m, [], null)) {
        expect(title).toContain("الوداد");
        expect(title).toContain("الرجاء");
        expect(title).toMatch(/1-3|3-1/);
      }
    }
    expect(resultTitles(match(1, 3), [], null).join("\n")).toContain("الرجاء يفوز على الوداد بنتيجة 3-1");
  });

  it("drops the country from the competition", () => {
    const text = resultTitles(match(2, 1), [], null).join("\n");
    expect(text).toContain("في الدوري المغربي");
    expect(text).not.toContain("المغرب,");
  });

  it("credits a hat-trick, a brace and a lone winner to the winning side only", () => {
    const hat = [goal("حكيمي", true, 1), goal("حكيمي", true, 2), goal("حكيمي", true, 3), goal("ضيف", false, 4)];
    expect(resultTitles(match(3, 1), hat, null)[0]).toContain("بهاتريك من حكيمي");
    const brace = [goal("حكيمي", true, 1), goal("حكيمي", true, 2)];
    expect(resultTitles(match(2, 0), brace, null)[0]).toContain("بثنائية حكيمي");
    expect(resultTitles(match(1, 0), [goal("زياش", true, 1)], null)[0]).toContain("هدف زياش يمنح الوداد الفوز");
    expect(resultTitles(match(0, 1), [goal("ضيف", false, 1)], null)[0]).toContain("هدف ضيف يمنح الرجاء الفوز");
  });

  it("gives an own goal to nobody", () => {
    expect(resultTitles(match(1, 0), [goal("ضيف", true, 1, "own")], null).join("\n")).not.toContain("ضيف");
  });

  it("names no scorer when the goal list is incomplete", () => {
    expect(resultTitles(match(3, 0), null, null).join("\n")).not.toMatch(/هاتريك|ثنائية|هدف .* يمنح/);
  });

  it("calls a draw a draw", () => {
    expect(resultTitles(match(0, 0), [], null)[0]).toContain("تعادل سلبي بين الوداد والرجاء");
    expect(resultTitles(match(2, 2), [], null)[0]).toContain("تعادل الوداد والرجاء بنتيجة 2-2");
  });

  it("settles a level match by its shootout", () => {
    const text = resultTitles(match(1, 1), [], { home: 3, away: 4 }).join("\n");
    expect(text).toContain("الرجاء يفوز على الوداد بركلات الترجيح 4-3");
    expect(text).not.toContain("تعادل الوداد");
  });

  it("never calls a running match finished", () => {
    const text = resultTitles(match(2, 1, { isFinished: false, isLive: true, statusText: "الشوط الثاني", clock: "67'" }), [], null).join("\n");
    expect(text).toContain("الشوط الثاني 67'");
    expect(text).toContain("الوداد يتقدم على الرجاء");
    expect(text).not.toMatch(/نهاية المباراة|يفوز/);
  });
});

describe("lineup titles", () => {
  const h = lineup("4-3-3", "الركراكي");
  const a = lineup("3-4-2-1", null);

  it("names both teams, and says official only once the match has started", () => {
    const after = lineupTitles(match(0, 0), h, a, "both");
    expect(after[0]).toBe("التشكيلة الرسمية لمباراة الوداد والرجاء");
    for (const title of after) { expect(title).toContain("الوداد"); expect(title).toContain("الرجاء"); }
    const before = lineupTitles(match(0, 0, { isFinished: false }), h, a, "both").join("\n");
    expect(before).not.toContain("الرسمية");
  });

  it("follows the team picked for the poster", () => {
    const text = lineupTitles(match(0, 0), h, a, "home").join("\n");
    expect(text).toContain("تشكيلة الوداد الرسمية أمام الرجاء");
    expect(text).toContain("الوداد بخطة 4-3-3 أمام الرجاء");
    expect(text).toContain("الركراكي يعلن تشكيلة الوداد");
    expect(lineupTitles(match(0, 0), h, a, "away").join("\n")).toContain("تشكيلة الرجاء الرسمية أمام الوداد");
  });

  it("skips a formation or coach it does not have", () => {
    const text = lineupTitles(match(0, 0), lineup(null, null), a, "home").join("\n");
    expect(text).not.toMatch(/null|بخطة|يعلن/);
  });
});

describe("stats titles", () => {
  const row = (id: number, homeValue: string, awayValue: string, homePercent = 50, awayPercent = 50) =>
    ({ id, name: "", homeValue, awayValue, homePercent, awayPercent, isMajor: true }) as StatRow;
  const rows = [row(10, "29%", "71%", 29, 71), row(3, "14", "15"), row(4, "5", "10"), row(76, "2.01", "3.97")];

  it("uses the real figures, side by side", () => {
    const text = statsTitles(match(1, 5), rows, null).join("\n");
    expect(text).toContain("الرجاء يسيطر على الكرة بنسبة 71% أمام الوداد");
    expect(text).toContain("التسديدات: الوداد 14 مقابل 15 الرجاء");
    expect(text).toContain("الأهداف المتوقعة: الوداد 2.01 مقابل 3.97 الرجاء");
  });

  it("names the half when the poster shows one", () => {
    const text = statsTitles(match(1, 5), rows, "الشوط الأول").join("\n");
    expect(text).toContain("إحصائيات الشوط الأول من مباراة الوداد والرجاء");
    expect(text).toContain("يسيطر على الكرة في الشوط الأول");
    expect(text).not.toContain("1-5");
  });

  it("leaves out a stat the match does not have, and an even possession", () => {
    const text = statsTitles(match(1, 1), [row(10, "50%", "50%", 50, 50)], null).join("\n");
    expect(text).not.toMatch(/يسيطر|التسديدات|المتوقعة/);
  });
});

describe("head-to-head titles", () => {
  const record = (over: Partial<H2HRecord>): H2HRecord => ({ played: 5, homeWins: 4, draws: 1, awayWins: 0, homeGoals: 13, awayGoals: 5, ...over });
  const past = (homeScore: number | null): PastMatch => ({
    id: 1, date: "2026-01-01", competitionId: 1, competition: "",
    home: { id: 1, name: "الوداد", score: homeScore, logo: null }, away: { id: 2, name: "الرجاء", score: 0, logo: null },
  });

  it("reads the record for the right side", () => {
    const text = h2hTitles(match(0, 0), [past(2)], record({})).join("\n");
    expect(text).toContain("آخر 5 مواجهات: الوداد 4 انتصارات، الرجاء دون فوز، وتعادل واحد");
    expect(text).toContain("الوداد يتفوق على الرجاء في آخر 5 مواجهات");
    expect(text).toContain("الوداد لم يخسر أمام الرجاء في آخر 5 مواجهات");
    expect(text).toContain("آخر مواجهة بين الفريقين: الوداد 2-0 الرجاء");
  });

  it("gives the lead to the away side when it has the wins", () => {
    const text = h2hTitles(match(0, 0), [], record({ homeWins: 1, awayWins: 3 })).join("\n");
    expect(text).toContain("الرجاء يتفوق على الوداد");
    expect(text).not.toContain("لم يخسر");
  });

  it("calls an even record even", () => {
    const text = h2hTitles(match(0, 0), [], record({ homeWins: 2, awayWins: 2 })).join("\n");
    expect(text).toContain("تكافؤ بين الوداد والرجاء");
    expect(text).not.toContain("يتفوق");
  });

  it("counts small and large numbers the Arabic way", () => {
    expect(h2hTitles(match(0, 0), [], record({ played: 2, homeWins: 2, awayWins: 0, draws: 0 }))[1]).toContain("آخر مواجهتين");
    expect(h2hTitles(match(0, 0), [], record({ played: 12, homeWins: 11, awayWins: 1, draws: 0 }))[1]).toContain("آخر 12 مواجهة");
  });

  it("copes with no meetings at all", () => {
    expect(h2hTitles(match(0, 0), [], record({ played: 0, homeWins: 0, draws: 0 }))).toHaveLength(1);
  });

  it("skips a meeting with no score", () => {
    expect(h2hTitles(match(0, 0), [past(null)], record({})).join("\n")).not.toContain("null");
  });
});
