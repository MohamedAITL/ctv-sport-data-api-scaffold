import type { Goal, LiveMatch } from "@/types/live";

const NTH = ["", "الأول", "الثاني", "الثالث", "الرابع", "الخامس"];

/** Where the goal left the match, said from the scorer's side. */
function moment(up: number, down: number, how: string, team: string, other: string): string {
  if (up === 1 && down === 0) return `يفتتح التسجيل${how} لصالح ${team} أمام ${other}`;
  if (up === down) return `يدرك التعادل${how} لصالح ${team} أمام ${other}`;
  if (up < down) return `يقلص الفارق${how} لصالح ${team} أمام ${other}`;
  if (up === down + 1) return `يمنح ${team} التقدم${how} أمام ${other}`;
  return `يعمق الفارق${how} لصالح ${team} أمام ${other}`;
}

/**
 * Titles to post with a goal. Every fact is already known, so they are built
 * from the match and never written by a model: each names the scorer, both teams
 * and the minute. `team` is the side the goal counts for, so on an own goal the
 * scorer plays for `other`. `goals` is null when the list does not add up to the
 * score, and then nothing about the score or a brace is claimed.
 */
export function goalTitles(match: Pick<LiveMatch, "home" | "away">, goal: Goal, goals: Goal[] | null): string[] {
  const team = goal.home ? match.home.name : match.away.name;
  const other = goal.home ? match.away.name : match.home.name;
  const at = `الدقيقة ${goal.minute.replace(/'/g, "")}`;
  const p = goal.player;

  if (!p) {
    return goal.kind === "own"
      ? [`هدف ذاتي يمنح ${team} هدفا أمام ${other} في ${at}`]
      : [`هدف ${team} في مرمى ${other} في ${at}`, `${team} يسجل أمام ${other} في ${at}`];
  }

  const up = goal.home ? goal.score.home : goal.score.away;
  const down = goal.home ? goal.score.away : goal.score.home;
  const result = up === down
    ? `والنتيجة تصبح ${up}-${down}`
    : `والنتيجة تصبح ${Math.max(up, down)}-${Math.min(up, down)} لصالح ${up > down ? team : other}`;

  if (goal.kind === "own") {
    return [
      `هدف ذاتي من ${p} لصالح ${team} أمام ${other} في ${at}`,
      `${p} يسجل بالخطأ في مرمى ${other} لصالح ${team} في ${at}`,
      ...(goals ? [`${other} ضد ${team}: ${p} يسجل في مرماه في ${at} ${result}`] : []),
    ];
  }

  const how = goal.kind === "penalty" ? " من ركلة جزاء" : "";
  const titles = [
    `${p} يسجل${how} لصالح ${team} أمام ${other} في ${at}`,
    `هدف ${team} أمام ${other}${how} في ${at} بإمضاء ${p}`,
    `في ${at}.. ${p} يهز شباك ${other}${how} لصالح ${team}`,
  ];
  if (goal.minute.includes("+")) titles.push(`في الوقت بدل الضائع: ${p} يسجل لصالح ${team} أمام ${other} في ${at}`);
  if (!goals) return [...titles, `${team} ضد ${other}: ${p} يسجل${how} في ${at}`];

  const nth = goals.filter((g) => g.player === p && g.kind !== "own" && g.order <= goal.order).length;
  titles.unshift(`${p} ${moment(up, down, how, team, other)} في ${at}`);
  titles.push(`${team} ضد ${other}: ${p} يسجل${how} في ${at} ${result}`);
  if (nth === 3) titles.unshift(`${p} يوقع على الهاتريك مع ${team} أمام ${other} في ${at}`);
  else if (nth >= 2 && nth < NTH.length) titles.splice(1, 0, `${p} يسجل هدفه ${NTH[nth]} مع ${team} أمام ${other} في ${at}`);
  return titles;
}
