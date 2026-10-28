import { render } from "@testing-library/react";
import MatchStatsPoster from "@/components/live/MatchStatsPoster";
import { DEFAULT_MATCH_STATS_LAYOUT } from "@/config/matchStatsLayout";
import type { LiveMatch, StatRow } from "@/types/live";

const match: LiveMatch = {
  id: 1, matchupId: "1-2-3", competitionId: 3, competition: "الدوري المغربي", competitionLogo: null,
  startTime: "2026-10-28T18:00:00Z", statusText: "انتهت", clock: "", isLive: false, isFinished: true,
  home: { id: 1, name: "الرجاء", score: 2, logo: null },
  away: { id: 2, name: "الوداد", score: 1, logo: null },
};
const row = (id: number, home: string, away: string): StatRow => ({
  id, name: `stat${id}`, homeValue: home, awayValue: away, homePercent: 0, awayPercent: 0, isMajor: true,
});

describe("MatchStatsPoster", () => {
  it("score reads away-home left to right, following the crests", () => {
    const { container } = render(<MatchStatsPoster match={match} rows={[]} period={null} layout={DEFAULT_MATCH_STATS_LAYOUT} templateSrc={null} />);
    expect(container.textContent).toContain("1 - 2");
  });

  it("a long list ends above lastRowY", () => {
    const rows = Array.from({ length: 20 }, (_, i) => row(i, "5", "3"));
    const { getByText } = render(<MatchStatsPoster match={match} rows={rows} period={null} layout={DEFAULT_MATCH_STATS_LAYOUT} templateSrc={null} />);
    const lastTop = parseFloat(getByText("stat19").style.top);
    expect(lastTop).toBeLessThanOrEqual(DEFAULT_MATCH_STATS_LAYOUT.lastRowY);
  });

  it("highlights the leading side's figure", () => {
    const { getByText } = render(<MatchStatsPoster match={match} rows={[row(1, "7", "2")]} period={null} layout={DEFAULT_MATCH_STATS_LAYOUT} templateSrc={null} />);
    expect(getByText("7")).toHaveStyle({ color: DEFAULT_MATCH_STATS_LAYOUT.value.leadColor });
  });
});

