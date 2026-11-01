import { goalTitles } from "@/lib/goalTitles";
import type { Goal } from "@/types/live";

const match = { home: { name: "الوداد الرياضي" }, away: { name: "الرجاء الرياضي" } } as Parameters<typeof goalTitles>[0];
const goal = (over: Partial<Goal>): Goal => ({
  order: 1, home: true, minute: "23'", player: "سفيان رحيمي", photo: null, kind: "field", score: { home: 1, away: 0 }, ...over,
});

describe("goal titles", () => {
  it.each([
    ["an open-play goal", goal({})],
    ["a penalty", goal({ kind: "penalty" })],
    ["an own goal", goal({ kind: "own" })],
    ["added time", goal({ minute: "90+12'" })],
    ["a goal for the away side", goal({ home: false, score: { home: 0, away: 1 } })],
  ])("name the scorer, both teams and the minute on %s", (_, g) => {
    const titles = goalTitles(match, g, [g]);
    expect(titles.length).toBeGreaterThan(1);
    for (const title of titles) {
      expect(title).toContain("سفيان رحيمي");
      expect(title).toContain("الوداد الرياضي");
      expect(title).toContain("الرجاء الرياضي");
      expect(title).toContain(`الدقيقة ${g.minute.replace("'", "")}`);
    }
    expect(new Set(titles).size).toBe(titles.length);
  });

  it.each([
    ["the opener", { home: 1, away: 0 }, "يفتتح التسجيل"],
    ["an equaliser", { home: 1, away: 1 }, "يدرك التعادل"],
    ["a go-ahead goal", { home: 2, away: 1 }, "يمنح الوداد الرياضي التقدم"],
    ["a goal that pulls one back", { home: 1, away: 3 }, "يقلص الفارق"],
    ["a goal that extends the lead", { home: 3, away: 1 }, "يعمق الفارق"],
  ])("say what %s did", (_, score, phrase) => {
    const g = goal({ score });
    expect(goalTitles(match, g, [g])[0]).toContain(phrase);
  });

  it("names the side ahead in the score, whoever scored", () => {
    const g = goal({ home: true, score: { home: 1, away: 3 } });
    expect(goalTitles(match, g, [g]).join("\n")).toContain("والنتيجة تصبح 3-1 لصالح الرجاء الرياضي");
  });

  it("counts a brace and a hat-trick, but not an own goal", () => {
    const first = goal({ order: 1 });
    const own = goal({ order: 2, kind: "own", home: false, score: { home: 1, away: 1 } });
    const second = goal({ order: 3, score: { home: 2, away: 1 } });
    const third = goal({ order: 4, score: { home: 3, away: 1 } });
    const all = [first, own, second, third];
    expect(goalTitles(match, second, all).join("\n")).toContain("هدفه الثاني");
    const hat = goalTitles(match, third, all);
    expect(hat[0]).toContain("الهاتريك");
    expect(goalTitles(match, first, all).join("\n")).not.toContain("هدفه");
  });

  it("keeps the penalty beside the verb", () => {
    const g = goal({ kind: "penalty", score: { home: 1, away: 1 } });
    expect(goalTitles(match, g, [g])[0]).toBe("سفيان رحيمي يدرك التعادل من ركلة جزاء لصالح الوداد الرياضي أمام الرجاء الرياضي في الدقيقة 23");
  });

  it("credits an own goal to the side it helped", () => {
    const g = goal({ kind: "own", home: true });
    expect(goalTitles(match, g, [g])[0]).toBe("هدف ذاتي من سفيان رحيمي لصالح الوداد الرياضي أمام الرجاء الرياضي في الدقيقة 23");
  });

  it("claims nothing about the score when the goal list is incomplete", () => {
    const text = goalTitles(match, goal({ score: { home: 2, away: 0 } }), null).join("\n");
    expect(text).not.toMatch(/النتيجة|يعمق|يفتتح|هدفه/);
    expect(goalTitles(match, goal({ kind: "own" }), null).join("\n")).not.toContain("النتيجة");
  });

  it("still gives titles for an unnamed scorer", () => {
    const g = goal({ player: null });
    const titles = goalTitles(match, g, [g]);
    expect(titles.length).toBeGreaterThan(0);
    for (const title of titles) {
      expect(title).toContain("الرجاء الرياضي");
      expect(title).toContain("الدقيقة 23");
      expect(title).not.toContain("null");
    }
  });
});
