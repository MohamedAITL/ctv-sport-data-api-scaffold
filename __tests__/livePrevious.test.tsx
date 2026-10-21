import { render, waitFor } from "@testing-library/react";
import LivePrevious from "@/components/live/LivePrevious";
import type { LiveDetail, LiveMatch } from "@/types/live";

// Shapes verified against the live route for نهضة بركان v الجيش الملكي, which
// returns four meetings: one Berkane win, two draws, one FAR win, goals 3-4.
const match: LiveMatch = {
  id: 1, matchupId: "9974-5455-557", competitionId: 557, competition: "الدوري المغربي",
  competitionLogo: null, startTime: "2026-10-20T19:00:00Z", statusText: "لم تبدأ", clock: "",
  isLive: false, isFinished: false,
  home: { id: 9974, name: "نهضة بركان", score: null, logo: null },
  away: { id: 5455, name: "الجيش الملكي", score: null, logo: null },
};
const detail = { match, homeLineup: null, awayLineup: null, events: [], statGroups: [], facts: [], shots: [], topPerformers: [], venue: null, referee: null, tv: [] } as LiveDetail;

const past = (id: number, date: string, h: string, hs: number, as: number, a: string) => ({
  id, date, competition: "الدوري المغربي",
  home: { name: h, score: hs, logo: null },
  away: { name: a, score: as, logo: null },
});

describe("LivePrevious", () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  it("shows the head-to-head record and every meeting", async () => {
    global.fetch = jest.fn(async () => ({
      json: async () => ({
        previous: {
          h2h: [
            past(1, "2026-06-25T20:00:00Z", "نهضة بركان", 2, 2, "الجيش الملكي"),
            past(2, "2026-04-22T20:00:00Z", "الجيش الملكي", 0, 0, "نهضة بركان"),
            past(3, "2026-04-18T20:00:00Z", "نهضة بركان", 1, 0, "الجيش الملكي"),
            past(4, "2026-04-11T20:00:00Z", "الجيش الملكي", 2, 0, "نهضة بركان"),
          ],
          record: { played: 4, homeWins: 1, draws: 2, awayWins: 1, homeGoals: 3, awayGoals: 4 },
          home: [past(5, "2026-10-13T20:00:00Z", "نهضة بركان", 2, 2, "نهضة الزمامرة")],
          away: [],
        },
        table: [],
      }),
    })) as unknown as typeof fetch;

    const { baseElement, getByText } = render(<LivePrevious d={detail} />);
    await waitFor(() => expect(baseElement.querySelector(".kh2h")).not.toBeNull());
    expect(getByText("المواجهات المباشرة")).toBeInTheDocument();
    // one win each side, two draws, and the goals over all four meetings
    const sides = Array.from(baseElement.querySelectorAll(".kh2h-side b")).map((b) => b.textContent);
    expect(sides).toEqual(["1", "2", "1"]);
    expect(baseElement.querySelector(".kh2h-meta")?.textContent).toContain("4 مواجهة");
    expect(baseElement.querySelector(".kh2h-meta")?.textContent).toContain("3 - 4");
    // every meeting is listed, not just the record
    expect(baseElement.querySelectorAll(".kpv section")[0].querySelectorAll(".kpv-row")).toHaveLength(4);
  });

  it("says so, rather than hiding the section, when the sides have never met", async () => {
    global.fetch = jest.fn(async () => ({
      json: async () => ({
        previous: {
          h2h: [],
          record: { played: 0, homeWins: 0, draws: 0, awayWins: 0, homeGoals: 0, awayGoals: 0 },
          home: [past(9, "2026-10-13T20:00:00Z", "نهضة بركان", 1, 0, "فريق")],
          away: [],
        },
        table: [],
      }),
    })) as unknown as typeof fetch;

    const { baseElement } = render(<LivePrevious d={detail} />);
    await waitFor(() => expect(baseElement.querySelector(".kpv")).not.toBeNull());
    // no record panel, but the heading and an explanation stay on screen —
    // an absent section reads as a failure, a sentence reads as an answer
    expect(baseElement.querySelector(".kh2h")).toBeNull();
    expect(baseElement.querySelector(".kpv-empty")?.textContent).toContain("لم يسبق للفريقين أن التقيا");
    expect(baseElement.textContent).toContain("المواجهات المباشرة");
    expect(baseElement.textContent).toContain("آخر مباريات");
  });
});
