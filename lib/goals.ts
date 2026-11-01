import type { Goal } from "@/types/live";

/** Whether the goals reach the match's score. A feed still catching up can lag it. */
export const goalsAddUp = (goals: Goal[], m: { home: { score: number | null }; away: { score: number | null } }) => {
  const last = goals[goals.length - 1]?.score ?? { home: 0, away: 0 };
  return last.home === (m.home.score ?? 0) && last.away === (m.away.score ?? 0);
};
