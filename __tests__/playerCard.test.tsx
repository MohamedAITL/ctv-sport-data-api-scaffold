import { render, waitFor, act } from "@testing-library/react";
import PlayerCard from "@/components/live/PlayerCard";
import type { LineupPlayer } from "@/types/live";

// Shapes verified live. The match payload carries `ranking` + a stat line; the
// season figures come from the athlete endpoint's `fullDetails` view, which is
// what 365scores' own player page calls.
const player = (over: Partial<LineupPlayer> = {}): LineupPlayer => ({
  id: 1, athleteId: 5802, name: "جابرييل باوليستا", shortName: "باوليستا",
  number: 6, photo: "https://img/v1/Athletes/5802", position: "الدفاع",
  role: "starting", rating: 6.9, line: 20, side: 50,
  stats: [
    { name: "الدقائق", value: "90'" },
    { name: "الأهداف", value: "0" },
    { name: "تمريرات صحيحة", value: "64/66 (97%)" },
  ],
  topStats: [{ name: "الدقائق", value: "90'" }],
  ...over,
});

const bio = {
  id: 5802, name: "باوليستا", age: 35, position: "الدفاع", nationality: "البرازيل",
  shirt: 6, summary: "لاعب كرة قدم",
  details: [{ name: "31/01/99", value: "35 سنة" }, { name: "الطول", value: "1.87" }, { name: "القدم المفضلة", value: "اليسار" }],
  seasons: [{
    competition: "الدوري البرازيلي الدرجة الأولى",
    top: [{ name: "المشاركات", value: "23/31" }, { name: "التقييم", value: "6.8" }],
    stats: [{ name: "لمسات", value: "1463" }],
  }],
};

const mockBio = (payload: unknown) => {
  global.fetch = jest.fn(async () => ({ json: async () => payload })) as unknown as typeof fetch;
};

describe("PlayerCard", () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  it("opens on this match's stat line, with the headline figures as tiles", async () => {
    mockBio({ bio });
    const { container, getByText } = render(<PlayerCard player={player()} team="كورينثيانز" onClose={() => {}} />);
    expect(getByText("6.9")).toBeInTheDocument();
    expect(container.querySelector(".kpc-tile")?.textContent).toContain("90'");
    // the remaining match stats are listed, never repeated as a tile
    expect(container.querySelectorAll(".kpc-list li")).toHaveLength(2);
    expect(container.textContent).toContain("64/66 (97%)");
    await waitFor(() => expect(container.textContent).toContain("البرازيل"));
    expect(container.textContent).toContain("القدم المفضلة: اليسار");
    // the birth row is titled with the date and valued with the age, which the
    // header already shows — it must not print "35 سنة" twice
    expect(container.textContent).toContain("مواليد 31/01/99");
    expect(container.textContent?.match(/35 سنة/g)).toHaveLength(1);
  });

  it("switches to the season, per competition", async () => {
    mockBio({ bio });
    const { container, getByText } = render(<PlayerCard player={player()} team="كورينثيانز" onClose={() => {}} />);
    await waitFor(() => expect(container.querySelector(".kpc-tabs")).not.toBeNull());
    act(() => { getByText("إحصائيات الموسم").click(); });
    expect(container.querySelector(".kpc-season h4")?.textContent).toBe("الدوري البرازيلي الدرجة الأولى");
    expect(container.textContent).toContain("23/31");
    expect(container.textContent).toContain("1463");
  });

  it("falls straight to the season when the match publishes no player stats", async () => {
    mockBio({ bio });
    const { container } = render(
      <PlayerCard player={player({ rating: null, stats: [], topStats: [] })} team="فريق" onClose={() => {}} />
    );
    expect(container.querySelector(".kpc-rate")).toBeNull();
    expect(container.querySelector(".kpc-tabs")).toBeNull(); // nothing to switch between
    await waitFor(() => expect(container.textContent).toContain("23/31"));
  });

  it("says so when neither the match nor the season has anything", async () => {
    mockBio({});
    const { container } = render(
      <PlayerCard player={player({ athleteId: null, rating: null, stats: [], topStats: [] })} team="فريق" onClose={() => {}} />
    );
    await waitFor(() => expect(container.querySelector(".kpc-none")).not.toBeNull());
  });
});
