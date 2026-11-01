import type { Goal, H2HRecord, LiveMatch, PastMatch, StatRow, TeamLineup } from "@/types/live";

// Titles to post with each live poster. Like goalTitles, they are built from the
// match and never written by a model, so none can state something that did not happen.

type Match = Pick<LiveMatch, "home" | "away" | "competition" | "isLive" | "isFinished" | "statusText" | "clock">;

/** "فرنسا, الدوري الفرنسي" also names the country; a title only needs the competition. */
const league = (m: Match) => (m.competition.split(/[,،]\s*/).pop() ?? "").trim();
const inLeague = (m: Match) => (league(m) ? ` في ${league(m)}` : "");

/** Same score, side by side, in the order the teams are named. */
const scoreline = (m: Match) => `${m.home.name} ${m.home.score ?? 0}-${m.away.score ?? 0} ${m.away.name}`;

/** Who carried a side's goals: the top scorer and how many. Own goals are nobody's. */
function topScorer(goals: Goal[], home: boolean): { name: string; goals: number } | null {
  const counts = new Map<string, number>();
  for (const g of goals) if (g.home === home && g.kind !== "own" && g.player) counts.set(g.player, (counts.get(g.player) ?? 0) + 1);
  const [best] = Array.from(counts).sort((a, b) => b[1] - a[1]);
  return best ? { name: best[0], goals: best[1] } : null;
}

/** `goals` is null when the list does not add up to the score: no scorer is then named. */
export function resultTitles(m: Match, goals: Goal[] | null, shootout: { home: number; away: number } | null): string[] {
  const h = m.home.score ?? 0;
  const a = m.away.score ?? 0;
  const home = m.home.name;
  const away = m.away.name;
  const homeAhead = h > a;
  const leader = homeAhead ? home : away;
  const other = homeAhead ? away : home;
  const hi = Math.max(h, a);
  const lo = Math.min(h, a);

  if (!m.isFinished) {
    const status = [m.statusText, m.clock].filter(Boolean).join(" ");
    return [
      `${status}: ${scoreline(m)}`,
      h === a ? `التعادل ${h}-${a} يسود مواجهة ${home} و${away}` : `${leader} يتقدم على ${other} بنتيجة ${hi}-${lo}`,
      `${home} ضد ${away}: النتيجة الآن ${h === a ? `${h}-${a}` : `${hi}-${lo} لصالح ${leader}`}`,
    ];
  }

  const end = `نهاية المباراة: ${scoreline(m)}`;
  if (h === a && shootout) {
    const homeWon = shootout.home > shootout.away;
    const winner = homeWon ? home : away;
    const loser = homeWon ? away : home;
    const kicks = `${Math.max(shootout.home, shootout.away)}-${Math.min(shootout.home, shootout.away)}`;
    return [
      `${winner} يفوز على ${loser} بركلات الترجيح ${kicks}`,
      `بعد التعادل ${h}-${a}.. ${winner} يتجاوز ${loser} بركلات الترجيح ${kicks}`,
      `ركلات الترجيح تمنح ${winner} الفوز على ${loser}${inLeague(m)}`,
      end,
    ];
  }
  if (h === a) {
    return h === 0
      ? [`تعادل سلبي بين ${home} و${away}${inLeague(m)}`, `${home} و${away} يكتفيان بالتعادل دون أهداف`, end]
      : [`تعادل ${home} و${away} بنتيجة ${h}-${a}${inLeague(m)}`, `${home} و${away} يكتفيان بالتعادل ${h}-${a}`, end];
  }

  const top = goals ? topScorer(goals, homeAhead) : null;
  return [
    ...(top && top.goals >= 3 ? [`بهاتريك من ${top.name}.. ${leader} يفوز على ${other} ${hi}-${lo}`] : []),
    ...(top && top.goals === 2 ? [`بثنائية ${top.name}.. ${leader} يفوز على ${other} ${hi}-${lo}`] : []),
    ...(top && hi === 1 ? [`هدف ${top.name} يمنح ${leader} الفوز على ${other}`] : []),
    ...(hi - lo >= 3 ? [`${leader} يكتسح ${other} بنتيجة ${hi}-${lo}`] : []),
    `${leader} يفوز على ${other} بنتيجة ${hi}-${lo}`,
    `فوز ${leader} على ${other} ${hi}-${lo}${inLeague(m)}`,
    ...(lo === 0 && hi - lo < 3 ? [`${leader} يهزم ${other} ${hi}-0 بشباك نظيفة`] : []),
    end,
  ];
}

/** "Official" only once the match has started: before that it may be a prediction. */
export function lineupTitles(m: Match, home: TeamLineup, away: TeamLineup, team: "both" | "home" | "away"): string[] {
  const official = m.isLive || m.isFinished ? " الرسمية" : "";
  if (team !== "both") {
    const own = team === "home" ? home : away;
    const name = team === "home" ? m.home.name : m.away.name;
    const opponent = team === "home" ? m.away.name : m.home.name;
    return [
      `تشكيلة ${name}${official} أمام ${opponent}`,
      ...(own.formation ? [`${name} بخطة ${own.formation} أمام ${opponent}`] : []),
      ...(own.coach ? [`${own.coach.name} يعلن تشكيلة ${name} أمام ${opponent}`] : []),
      `تشكيلة ${name} ضد ${opponent}${inLeague(m)}`,
    ];
  }
  return [
    `التشكيلة${official} لمباراة ${m.home.name} و${m.away.name}`,
    `تشكيلة ${m.home.name} و${m.away.name}${inLeague(m)}`,
    `${m.home.name} ضد ${m.away.name}: تشكيلة الفريقين`,
    ...(home.formation && away.formation ? [`${m.home.name} بخطة ${home.formation} و${m.away.name} بخطة ${away.formation}`] : []),
  ];
}

// The source's own stat ids, the same on every match.
const POSSESSION = 10;
const EXPECTED_GOALS = 76;
const SHOTS = 3;
const ON_TARGET = 4;

/** `period` names a half when the poster shows one; null is the whole match. */
export function statsTitles(m: Match, rows: StatRow[], period: string | null): string[] {
  const home = m.home.name;
  const away = m.away.name;
  const during = period ? ` في ${period}` : "";
  const versus = (id: number, label: string) => {
    const r = rows.find((x) => x.id === id);
    return r ? [`${label}${during}: ${home} ${r.homeValue} مقابل ${r.awayValue} ${away}`] : [];
  };
  const ball = rows.find((x) => x.id === POSSESSION);
  const homeHadIt = ball ? ball.homePercent > ball.awayPercent : false;
  return [
    `إحصائيات ${period ?? "مباراة"}${period ? ` من مباراة` : ""} ${home} و${away}`,
    ...(period ? [] : [`بالأرقام: ${scoreline(m)}`]), // a half's poster must not print the final score
    ...(ball && ball.homePercent !== ball.awayPercent
      ? [`${homeHadIt ? home : away} يسيطر على الكرة${during} بنسبة ${homeHadIt ? ball.homeValue : ball.awayValue} أمام ${homeHadIt ? away : home}`]
      : []),
    ...versus(SHOTS, "التسديدات"),
    ...versus(ON_TARGET, "التسديدات على المرمى"),
    ...versus(EXPECTED_GOALS, "الأهداف المتوقعة"),
  ];
}

// Arabic counts its one and two in words, and past ten takes the singular.
const count = (n: number, one: string, two: string, few: string, many: string) =>
  (n === 1 ? one : n === 2 ? two : n <= 10 ? `${n} ${few}` : `${n} ${many}`);
const meetingsWord = (n: number) => (n === 1 ? "آخر مواجهة" : n === 2 ? "آخر مواجهتين" : n <= 10 ? `آخر ${n} مواجهات` : `آخر ${n} مواجهة`);
const wins = (n: number) => (n === 0 ? "دون فوز" : count(n, "فوز واحد", "فوزان", "انتصارات", "فوزا"));
const draws = (n: number) => (n === 0 ? "دون تعادل" : count(n, "تعادل واحد", "تعادلان", "تعادلات", "تعادلا"));

/** The poster's own meetings, newest first, with their record for `m.home`. */
export function h2hTitles(m: Match, meetings: PastMatch[], r: H2HRecord): string[] {
  const home = m.home.name;
  const away = m.away.name;
  const last = meetingsWord(r.played);
  if (r.played === 0) return [`${home} ضد ${away}: تاريخ المواجهات بين الفريقين`];

  const latest = meetings.find((x) => x.home.score !== null && x.away.score !== null);
  const homeLeads = r.homeWins > r.awayWins;
  const leader = homeLeads ? home : away;
  const trailer = homeLeads ? away : home;
  const unbeaten = (homeLeads ? r.awayWins : r.homeWins) === 0;
  return [
    `تاريخ مواجهات ${home} و${away}`,
    `${home} ضد ${away}: ${last} بين الفريقين`,
    `${last}: ${home} ${wins(r.homeWins)}، ${away} ${wins(r.awayWins)}، و${draws(r.draws)}`,
    ...(r.homeWins === r.awayWins
      ? [`تكافؤ بين ${home} و${away} في ${last}`]
      : [`${leader} يتفوق على ${trailer} في ${last}`]),
    ...(r.homeWins !== r.awayWins && unbeaten && r.played > 1 ? [`${leader} لم يخسر أمام ${trailer} في ${last}`] : []),
    ...(latest ? [`آخر مواجهة بين الفريقين: ${latest.home.name} ${latest.home.score}-${latest.away.score} ${latest.away.name}`] : []),
  ];
}
