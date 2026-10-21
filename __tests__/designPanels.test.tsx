import { fireEvent, render } from "@testing-library/react";
import DesignSettings from "@/components/DesignSettings";
import MatchdayDesign from "@/components/MatchdayDesign";
import StatsDesign from "@/components/StatsDesign";
import { DEFAULT_LAYOUT } from "@/config/defaultLayout";
import { DEFAULT_MATCHDAY_LAYOUT } from "@/config/matchdayLayout";
import { DEFAULT_STATS_LAYOUT, type StatsLayout } from "@/config/statsLayout";

// The canvas is fixed at 1080x1350; everything else on a poster is meant to be
// editable from its page. The stats panel exposed eight of thirty-eight values,
// the standings panel thirty-four of fifty-eight — the rest could only be
// changed by editing the defaults in code. This fails if a field is added to a
// layout without a control to drive it.
const FIXED = new Set(["width", "height"]);

const leaves = (value: unknown, path = ""): string[] => {
  if (value === null || typeof value !== "object") return [path];
  return Object.entries(value as Record<string, unknown>)
    .filter(([k]) => !(path === "" && FIXED.has(k)))
    .flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
};

// A panel hides an overlay's detail controls while that overlay is switched
// off, so every flag is turned on before counting.
const allShown = <T,>(layout: T): T => {
  const copy = JSON.parse(JSON.stringify(layout));
  const walk = (o: Record<string, unknown>) => {
    for (const [k, v] of Object.entries(o)) {
      if (k === "show") o[k] = true;
      else if (v && typeof v === "object") walk(v as Record<string, unknown>);
    }
  };
  walk(copy);
  return copy as T;
};

const STANDINGS = allShown(DEFAULT_LAYOUT);
const MATCHDAY = allShown(DEFAULT_MATCHDAY_LAYOUT);
const STATS = allShown(DEFAULT_STATS_LAYOUT);

const PANELS = [
  ["الترتيب", <DesignSettings key="s" layout={STANDINGS} onChange={() => {}} />, STANDINGS],
  ["مباريات اليوم", <MatchdayDesign key="m" layout={MATCHDAY} onChange={() => {}} />, MATCHDAY],
  ["الإحصائيات", <StatsDesign key="t" layout={STATS} onChange={() => {}} />, STATS],
] as const;

describe("poster design panels", () => {
  it.each(PANELS.map(([name, el, layout]) => [name, el, layout] as const))(
    "%s: every editable value has a control",
    (_name, element, layout) => {
      const { container } = render(<details open>{element}</details>);
      // a <details> in the tree renders its children regardless of `open`
      const controls =
        container.querySelectorAll("input").length + container.querySelectorAll("select").length;
      expect(controls).toBe(leaves(layout).length);
    }
  );

  it("writes an edit back without mutating the layout it was given", () => {
    const layout = JSON.parse(JSON.stringify(DEFAULT_STATS_LAYOUT)) as StatsLayout;
    let next: StatsLayout | null = null;
    const { container } = render(<StatsDesign layout={layout} onChange={(n) => { next = n; }} />);
    const field = Array.from(container.querySelectorAll(".field"))
      .find((f) => f.querySelector("span")?.textContent === "لون البطاقة");
    fireEvent.change(field!.querySelector("input")!, { target: { value: "#ff0000" } });
    expect(next).not.toBeNull();
    expect(next!.rowBg.color).toBe("#ff0000");
    expect(layout.rowBg.color).toBe(DEFAULT_STATS_LAYOUT.rowBg.color); // untouched
  });

  it("uses the right kind of control for colours and flags", () => {
    const { container } = render(<StatsDesign layout={DEFAULT_STATS_LAYOUT} onChange={() => {}} />);
    const all = leaves(DEFAULT_STATS_LAYOUT);
    expect(container.querySelectorAll('input[type="color"]')).toHaveLength(all.filter((k) => /color/i.test(k)).length);
    expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(all.filter((k) => /show/i.test(k)).length);
  });
});
