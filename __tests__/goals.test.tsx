import { render } from "@testing-library/react";
import { toGoals, toShootout } from "@/lib/live365";
import { goalsAddUp } from "@/lib/goals";
import GoalPoster from "@/components/live/GoalPoster";
import FullTimePoster, { scorerLines } from "@/components/live/FullTimePoster";
import { DEFAULT_GOAL_LAYOUT } from "@/config/goalLayout";
import { DEFAULT_FULL_TIME_LAYOUT } from "@/config/fullTimeLayout";
import type { LiveMatch } from "@/types/live";

// Shapes as the feed sent them on 30 Oct 2026.
const members = [
  { id: 365442, athleteId: 58046, name: "خوسيه فاخاردو", imageVersion: 27 },
  { id: 483900, athleteId: 5312, name: "إيمانويل أوليفيرا", imageVersion: 12 }, // away side's player
  { id: 57592316, athleteId: 900, name: "لاعب ثالث" },
];
const goal = (order: number, competitorId: number, playerId: number, subTypeId: number, gameTimeDisplay: string, addedTime = 0) => ({
  competitorId, playerId, order, gameTimeDisplay, addedTime, stageId: 7, eventType: { id: 1, name: "هدف", subTypeId },
});
const HOME = 8640, AWAY = 7644;

describe("toGoals", () => {
  it("keeps the order and builds the running score", () => {
    const g = toGoals([goal(2, AWAY, 483900, 1, "40'"), goal(1, HOME, 365442, 1, "14'")], members, HOME);
    expect(g.map((x) => x.score)).toEqual([{ home: 1, away: 0 }, { home: 1, away: 1 }]);
    expect(g[0].player).toBe("خوسيه فاخاردو");
  });

  it("counts an own goal for the side it helped, with the scorer who put it in", () => {
    // The real case: home won 2-0, the second goal by an away player.
    const g = toGoals([goal(1, HOME, 365442, 1, "24'"), goal(2, HOME, 483900, 2, "28'")], members, HOME);
    expect(g[1]).toMatchObject({ home: true, kind: "own", player: "إيمانويل أوليفيرا", score: { home: 2, away: 0 } });
  });

  it("marks a penalty and writes added time", () => {
    const [g] = toGoals([goal(5, HOME, 57592316, 3, "90'", 12)], members, HOME);
    expect(g).toMatchObject({ kind: "penalty", minute: "90+12'" });
  });

  it("asks for a large face", () => {
    const [g] = toGoals([goal(1, HOME, 365442, 1, "14'")], members, HOME);
    expect(g.photo).toContain("w_400,h_400");
    expect(g.photo).toContain("Athletes/58046");
  });

  it("ignores what is not a goal, and shootout kicks", () => {
    const events = [
      { competitorId: HOME, order: 1, eventType: { id: 11, name: "الهدف الغي", subTypeId: 25 } }, // VAR
      { competitorId: HOME, order: 2, eventType: { id: 6, name: "إضاعة الضّربات الجّزائيّة" } },
      { competitorId: HOME, order: 3, stageId: 11, eventType: { id: 1, subTypeId: 3 } },
    ];
    expect(toGoals(events, members, HOME)).toEqual([]);
  });

  it("survives a goal with no known scorer", () => {
    const [g] = toGoals([goal(1, HOME, 1, 1, "3'")], members, HOME);
    expect(g).toMatchObject({ player: null, photo: null });
  });
});

describe("goalsAddUp", () => {
  const m = (h: number | null, a: number | null) => ({ home: { score: h }, away: { score: a } });
  const two = toGoals([goal(1, HOME, 365442, 1, "1'"), goal(2, AWAY, 483900, 1, "2'")], members, HOME);
  it("agrees with the match score", () => expect(goalsAddUp(two, m(1, 1))).toBe(true));
  it("notices a feed that is behind", () => expect(goalsAddUp(two, m(2, 1))).toBe(false));
  it("is fine for a goalless match, started or not", () => {
    expect(goalsAddUp([], m(0, 0))).toBe(true);
    expect(goalsAddUp([], m(null, null))).toBe(true);
  });
});

describe("toShootout", () => {
  it("reads the shootout stage", () => {
    expect(toShootout([{ id: 7 }, { id: 11, homeCompetitorScore: 4, awayCompetitorScore: 5 }])).toEqual({ home: 4, away: 5 });
  });
  it("is null otherwise", () => expect(toShootout([{ id: 7 }, { id: 9 }])).toBeNull());
});

const match: LiveMatch = {
  id: 1, matchupId: "1-2-3", competitionId: 3, competition: "الدوري المغربي", competitionLogo: null,
  startTime: "2026-10-28T18:00:00Z", statusText: "انتهت", clock: "", isLive: false, isFinished: true,
  home: { id: HOME, name: "الرجاء", score: 2, logo: null },
  away: { id: AWAY, name: "الوداد", score: 1, logo: null },
};
const goals = toGoals([goal(1, HOME, 365442, 1, "10'"), goal(2, AWAY, 483900, 3, "30'"), goal(3, HOME, 365442, 1, "90'", 4)], members, HOME);

describe("posters", () => {
  it("the goal poster prints the score that goal left, away first left to right", () => {
    const { container } = render(<GoalPoster match={match} goal={goals[0]} score={goals[0].score} layout={DEFAULT_GOAL_LAYOUT} templateSrc={null} />);
    expect(container.textContent).toContain("0 - 1");
    expect(container.textContent).toContain("هدف!");
    expect(container.textContent).toContain("خوسيه فاخاردو");
  });

  it("names a penalty and an own goal", () => {
    const pen = render(<GoalPoster match={match} goal={goals[1]} score={goals[1].score} layout={DEFAULT_GOAL_LAYOUT} templateSrc={null} />);
    expect(pen.container.textContent).toContain("ركلة جزاء");
    const own = render(<GoalPoster match={match} goal={{ ...goals[0], kind: "own" }} score={goals[0].score} layout={DEFAULT_GOAL_LAYOUT} templateSrc={null} />);
    expect(own.container.textContent).toContain("هدف ذاتي");
  });

  it("the full-time poster lists scorers per side and merges a brace", () => {
    expect(scorerLines(goals, true)).toEqual([{ name: "خوسيه فاخاردو", minutes: "10' ، 90+4'" }]);
    expect(scorerLines(goals, false)).toEqual([{ name: "إيمانويل أوليفيرا", minutes: "30' (ض.ج)" }]);
    const { container } = render(<FullTimePoster match={match} goals={goals} shootout={null} layout={DEFAULT_FULL_TIME_LAYOUT} templateSrc={null} />);
    expect(container.textContent).toContain("نهاية المباراة");
    expect(container.textContent).toContain("1 - 2");
  });

  it("a running match does not claim to be over", () => {
    const live = { ...match, isFinished: false, isLive: true, statusText: "الشوط الثاني", clock: "67'" };
    const { container } = render(<FullTimePoster match={live} goals={goals} shootout={null} layout={DEFAULT_FULL_TIME_LAYOUT} templateSrc={null} />);
    expect(container.textContent).not.toContain("نهاية المباراة");
    expect(container.textContent).toContain("الشوط الثاني 67'");
  });

  it("shows a shootout", () => {
    const { container } = render(<FullTimePoster match={match} goals={[]} shootout={{ home: 4, away: 5 }} layout={DEFAULT_FULL_TIME_LAYOUT} templateSrc={null} />);
    expect(container.textContent).toContain("5 - 4");
  });
});

describe("a long scorer line", () => {
  it("shrinks instead of being cut off", () => {
    const brace = toGoals([goal(1, HOME, 365442, 1, "12'"), goal(2, HOME, 365442, 3, "34'"), goal(3, HOME, 365442, 3, "71'")], members, HOME);
    const { getByText } = render(<FullTimePoster match={match} goals={brace} shootout={null} layout={DEFAULT_FULL_TIME_LAYOUT} templateSrc={null} />);
    const line = getByText(/12' ، 34' \(ض\.ج\)/).parentElement as HTMLElement;
    expect(line.style.overflow).toBe("");
    expect(parseFloat(line.style.fontSize)).toBeLessThan(DEFAULT_FULL_TIME_LAYOUT.scorers.fontSize);
  });
});
