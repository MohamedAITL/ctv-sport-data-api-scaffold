import { render } from "@testing-library/react";
import MatchdayPoster from "@/components/MatchdayPoster";
import { DEFAULT_MATCHDAY_LAYOUT } from "@/config/matchdayLayout";
import type { Match } from "@/types/fixtures";

// MOCK match: home 2 - 1 away. Home sits on the RIGHT of the poster, so in the
// left-to-right centre the away score must come first ("1-2"), not "2-1".
const mk = (over: Partial<Match> = {}): Match => ({
  id: "m", date: "2026-10-18", time: "20:00", kickoffUtc: "2026-10-18T20:00:00Z",
  status: "FINISHED", statusLabel: "2 - 1", isFinished: true, isLive: false,
  leagueId: "L", leagueName: "La Liga", leagueLogo: null, leaguePopularity: 95, round: null, fame: 2,
  home: { id: "h", name: "Home", nameAr: "الأول", badge: null, score: 2 },
  away: { id: "a", name: "Away", nameAr: "الثاني", badge: null, score: 1 },
  ...over,
});
const draw = (matches: Match[], mode: "fixtures" | "results") =>
  render(<MatchdayPoster matches={matches} layout={DEFAULT_MATCHDAY_LAYOUT} templateSrc={null} nameOverrides={{}} logoOverrides={{}} mode={mode} />);

describe("MatchdayPoster modes", () => {
  it("results: finished match shows the score with the away score on the left", () => {
    const { container } = draw([mk()], "results");
    expect(container.textContent).toContain("1-2");
    expect(container.textContent).not.toContain("20:00");
  });

  it("results: unplayed match keeps its kickoff time, dimmed, with no score", () => {
    const { container, getByText } = draw(
      [mk({ isFinished: false, status: "SCHEDULED", home: { id: "h", name: "H", nameAr: "ه", badge: null, score: null }, away: { id: "a", name: "A", nameAr: "أ", badge: null, score: null } })],
      "results"
    );
    expect(getByText("20:00")).toHaveStyle({ opacity: "0.5" });
    expect(container.textContent).not.toMatch(/\d-\d/);
  });

  it("fixtures: always shows kickoff time, even for a finished match", () => {
    const { container } = draw([mk()], "fixtures");
    expect(container.textContent).toContain("20:00");
    expect(container.textContent).not.toContain("1-2");
  });

  it("results: shows the penalty line only when both penalty scores exist", () => {
    const withPens = draw([mk({ home: { id: "h", name: "H", nameAr: "ه", badge: null, score: 1, pen: 4 }, away: { id: "a", name: "A", nameAr: "أ", badge: null, score: 1, pen: 3 } })], "results");
    expect(withPens.container.textContent).toContain("(3 - 4)");
    const noPens = draw([mk()], "results");
    expect(noPens.container.textContent).not.toContain("(");
  });

  it("results title replaces the fixtures title", () => {
    const { container } = draw([mk()], "results");
    expect(container.textContent).toContain("نتائج مباريات اليوم");
  });
});

describe("MatchdayPoster grouping", () => {
  // A round is played over two or three days, so the round poster groups by
  // day instead of by competition.
  const day = (id: string, date: string) => mk({ id, date, kickoffUtc: `${date}T20:00:00Z`, isFinished: false, status: "SCHEDULED" });

  it("groupBy=date puts one header per day, in date order", () => {
    const { container } = render(
      <MatchdayPoster
        matches={[day("c", "2026-11-08"), day("a", "2026-11-06"), day("b", "2026-11-07")]}
        layout={DEFAULT_MATCHDAY_LAYOUT} templateSrc={null} nameOverrides={{}} logoOverrides={{}}
        mode="fixtures" groupBy="date"
      />
    );
    const headers = Array.from(container.querySelectorAll("span"))
      .map((s) => s.textContent ?? "")
      .filter((t) => /نونبر|November/.test(t));
    expect(headers).toHaveLength(3);
    expect(headers[0]).toContain("6");
    expect(headers[2]).toContain("8");
  });

  it("defaults to grouping by competition", () => {
    const { container } = render(
      <MatchdayPoster
        matches={[mk()]} layout={DEFAULT_MATCHDAY_LAYOUT} templateSrc={null}
        nameOverrides={{}} logoOverrides={{}} mode="fixtures"
      />
    );
    expect(container.textContent).toContain("La Liga");
  });
});

describe("MatchdayPoster auto-fit", () => {
  // 11 matches over 4 competitions overflow the default rows a little: the
  // spacing can absorb it, so crests and names should keep their full size.
  const crowded = Array.from({ length: 11 }, (_, i) => mk({ id: `m${i}`, leagueId: `L${i % 4}`, leagueName: `L${i % 4}` }));
  const nameSize = (keepSizes: boolean) => {
    const { getAllByText } = render(
      <MatchdayPoster matches={crowded} layout={{ ...DEFAULT_MATCHDAY_LAYOUT, keepSizes }} templateSrc={null} nameOverrides={{}} logoOverrides={{}} />
    );
    return parseFloat(getAllByText("الأول")[0].style.fontSize);
  };

  it("keepSizes squeezes the spacing and leaves names full size", () => {
    expect(nameSize(true)).toBe(DEFAULT_MATCHDAY_LAYOUT.nameFontSize);
  });

  it("without keepSizes everything shrinks together", () => {
    expect(nameSize(false)).toBeLessThan(DEFAULT_MATCHDAY_LAYOUT.nameFontSize);
  });
});
