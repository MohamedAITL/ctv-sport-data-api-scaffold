import { fireEvent, render } from "@testing-library/react";
import LineupSwaps, { withSwaps, type Swaps } from "@/components/live/LineupSwaps";
import type { LineupPlayer, TeamLineup } from "@/types/live";

const p = (id: number, line: number | null, side: number | null, role: LineupPlayer["role"] = "starting"): LineupPlayer => ({
  id, athleteId: null, name: `p${id}`, shortName: `p${id}`, number: id, photo: null, position: "الوسط",
  role, rating: null, stats: [], topStats: [], line, side,
});
const lineup: TeamLineup = {
  formation: "4-3-3", hasFieldPositions: true,
  starting: [p(1, 0, 50), p(2, 66, 20), p(3, 99, 80)],
  bench: [p(10, null, null, "substitute"), p(11, null, null, "substitute")],
  missing: [], coach: null,
};

// The slot is the position, the player is who fills it: a substitute has no
// coordinates of his own, so he takes the starter's.
it("puts the substitute in the starter's spot and leaves the others alone", () => {
  const xi = withSwaps(lineup, "h", { h2: 10 }).starting;
  expect(xi.map((x) => x.id)).toEqual([1, 10, 3]);
  expect([xi[1].line, xi[1].side]).toEqual([66, 20]);
  expect(xi[1].name).toBe("p10");
});

it("ignores a swap for the other team or for someone no longer on the bench", () => {
  expect(withSwaps(lineup, "h", { a2: 10 }).starting.map((x) => x.id)).toEqual([1, 2, 3]);
  expect(withSwaps(lineup, "h", { h2: 99 }).starting.map((x) => x.id)).toEqual([1, 2, 3]);
});

it("swaps from the editor, and never offers one substitute for two slots", () => {
  let swaps: Swaps = { h1: 10 };
  // Controlled, as in the popup: every change comes back in as the new props.
  const view = () => <LineupSwaps title="t" tag="h" lineup={lineup} swaps={swaps} onChange={(n) => { swaps = n; rerender(view()); }} />;
  const { container, rerender } = render(view());
  const selects = container.querySelectorAll("select");
  expect(selects).toHaveLength(3);
  const offered = (i: number) => Array.from(selects[i].querySelectorAll("option")).map((o) => Number(o.value));
  expect(offered(0)).toEqual([1, 10, 11]); // slot 1 holds sub 10: back to its starter, or the other sub
  expect(offered(1)).toEqual([2, 11]); // sub 10 is already on, so slot 2 only gets 11
  fireEvent.change(selects[1], { target: { value: "11" } });
  expect(swaps).toEqual({ h1: 10, h2: 11 });
  fireEvent.change(selects[0], { target: { value: "1" } });
  expect(swaps).toEqual({ h2: 11 }); // back to the starter: the swap is dropped
});
