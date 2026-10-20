import { render, waitFor } from "@testing-library/react";
import PlayerCard from "@/components/live/PlayerCard";
import type { LineupPlayer } from "@/types/live";

// Shape verified live: a lineup member carries `ranking` plus a 21-entry stat
// line, which is what the card is built from — only the bio needs a request.
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

describe("PlayerCard", () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  it("shows the rating, stat line and the bio it fetches", async () => {
    global.fetch = jest.fn(async () => ({
      json: async () => ({ bio: { id: 5802, name: "باوليستا", age: 35, position: "الدفاع", nationality: "البرازيل" } }),
    })) as unknown as typeof fetch;

    const { container, getByText } = render(<PlayerCard player={player()} team="كورينثيانز" onClose={() => {}} />);
    expect(getByText("6.9")).toBeInTheDocument();
    expect(container.querySelectorAll(".kpc-list li")).toHaveLength(3);
    expect(container.textContent).toContain("64/66 (97%)");
    expect(container.textContent).toContain("كورينثيانز");
    await waitFor(() => expect(container.textContent).toContain("البرازيل"));
    expect(container.textContent).toContain("35 سنة");
  });

  it("says so when the match publishes no stats for the player", () => {
    global.fetch = jest.fn(async () => ({ json: async () => ({}) })) as unknown as typeof fetch;
    const { container } = render(
      <PlayerCard player={player({ rating: null, stats: [], topStats: [] })} team="فريق" onClose={() => {}} />
    );
    expect(container.querySelector(".kpc-none")).not.toBeNull();
    expect(container.querySelector(".kpc-rate")).toBeNull();
  });
});
