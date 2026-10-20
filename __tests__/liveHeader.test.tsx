import { render, screen } from "@testing-library/react";
import LiveHeader from "@/components/live/LiveHeader";
import type { LiveDetail, LiveMatch } from "@/types/live";

const match = (over: Partial<LiveMatch> = {}): LiveMatch => ({
  id: 1, matchupId: "1-2-11", competitionId: 11, competition: "الدوري الإسباني",
  startTime: "2026-10-21T19:30:00+00:00", statusText: "لم تبدأ", clock: "",
  isLive: false, isFinished: false,
  home: { id: 1, name: "خيتافي", score: null, logo: null },
  away: { id: 2, name: "رايو", score: null, logo: null },
  ...over,
});

const detail = (m: LiveMatch): LiveDetail => ({
  match: m, homeLineup: null, awayLineup: null, events: [], stats: [],
  statFilters: [], topPerformers: [], venue: null, referee: null, tv: [],
});

describe("LiveHeader", () => {
  it("puts the kickoff time and status in the centre before kickoff", () => {
    render(<LiveHeader d={detail(match())} />);
    const soon = document.querySelector(".kh-soon");
    expect(soon).not.toBeNull();
    expect(soon!.textContent).toContain("لم تبدأ");
    // and no scoreline dashes pretending to be a result
    expect(document.querySelector(".kh-nums")).toBeNull();
    expect(document.querySelector(".kh-status")).toBeNull();
  });

  it("shows the score once there is one", () => {
    render(<LiveHeader d={detail(match({
      statusText: "الشوط الأول", clock: "45'", isLive: true,
      home: { id: 1, name: "خيتافي", score: 2, logo: null },
      away: { id: 2, name: "رايو", score: 0, logo: null },
    }))} />);
    expect(document.querySelector(".kh-nums")!.textContent).toContain("2");
    expect(document.querySelector(".kh-soon")).toBeNull();
    expect(screen.getByText(/الشوط الأول · 45'/)).toBeInTheDocument();
  });
});
