import { createRef } from "react";
import { render } from "@testing-library/react";
import Poster from "@/components/Poster";
import { DEFAULT_LAYOUT, FULL_CANVAS_LAYOUT, defaultLayoutFor } from "@/config/defaultLayout";
import { BOTOLA_LEAGUE, BOTOLA2_LEAGUE } from "@/config/standingsLeagues";
import type { TeamRow } from "@/types/standings";

const mkRows = (n: number, withLogo = true): TeamRow[] =>
  Array.from({ length: n }, (_, i) => ({
    rank: i + 1, teamId: "t" + i, nameOriginal: "Club" + i, nameAr: "نادي " + i,
    played: 4, wins: 2, draws: 1, losses: 1, gf: 5, ga: 4, points: 7,
    logo: withLogo ? "data:image/png;base64,AAAA" : null, promotion: null,
  }));

describe("Poster", () => {
  it("renders an exact 1080x1350 export node", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Poster ref={ref} rows={mkRows(16)} layout={DEFAULT_LAYOUT} templateSrc="/t.jpg" logoOverrides={{}} />);
    expect(ref.current?.style.width).toBe("1080px");
    expect(ref.current?.style.height).toBe("1350px");
  });

  it("adapts to a different club count (dynamic rows)", () => {
    for (const n of [14, 16, 18]) {
      const { container, unmount } = render(
        <Poster rows={mkRows(n)} layout={DEFAULT_LAYOUT} templateSrc="/t.jpg" logoOverrides={{}} />
      );
      // one logo <img> per row (plus the base template img)
      expect(container.querySelectorAll("img").length).toBe(n + 1);
      unmount();
    }
  });

  it("shows a fallback chip when a logo is missing", () => {
    const { container } = render(
      <Poster rows={mkRows(1, false)} layout={DEFAULT_LAYOUT} templateSrc="/t.jpg" logoOverrides={{}} />
    );
    // only the base template img; row logo replaced by a fallback letter
    expect(container.querySelectorAll("img").length).toBe(1);
    expect(container.textContent).toContain("C"); // first letter of "Club0"
  });

  it("prefers a logo override over the API logo", () => {
    const { container } = render(
      <Poster rows={mkRows(1)} layout={DEFAULT_LAYOUT} templateSrc="/t.jpg" logoOverrides={{ t0: "data:image/png;base64,ZZZZ" }} />
    );
    const imgs = Array.from(container.querySelectorAll("img"));
    expect(imgs.some((im) => im.getAttribute("src") === "data:image/png;base64,ZZZZ")).toBe(true);
  });

  // Distinct `top` values = rows stacked in one column; two columns reuse the
  // same vertical slots, so the count of distinct tops is what distinguishes them.
  const distinctTops = (container: HTMLElement) =>
    new Set(
      Array.from(container.querySelectorAll<HTMLElement>("img[src^='data:']")).map((im) => im.style.top)
    ).size;

  it("keeps a 16-row table in a single column (Botola unchanged)", () => {
    const { container } = render(
      <Poster rows={mkRows(16)} layout={DEFAULT_LAYOUT} templateSrc="/t.jpg" logoOverrides={{}} />
    );
    expect(distinctTops(container)).toBe(16);
  });

  it("splits a 36-row table into two columns of 18 so rows stay readable", () => {
    const { container } = render(
      <Poster rows={mkRows(36)} layout={FULL_CANVAS_LAYOUT} templateSrc={null as unknown as string} logoOverrides={{}} />
    );
    const logos = Array.from(container.querySelectorAll<HTMLElement>("img[src^='data:']"));
    expect(logos.length).toBe(36);
    // 18 vertical slots, each used twice (one per column)
    expect(distinctTops(container)).toBe(18);
    expect(new Set(logos.map((im) => im.style.left)).size).toBe(2);
  });

  it("keeps a 36-row table legible rather than shrinking it away", () => {
    const { container } = render(
      <Poster rows={mkRows(36)} layout={FULL_CANVAS_LAYOUT} templateSrc={null as unknown as string} logoOverrides={{}} />
    );
    const name = container.querySelector<HTMLElement>("div[style*='direction: rtl'][style*='nowrap']");
    const size = parseFloat(name?.style.fontSize || "0");
    expect(size).toBeGreaterThanOrEqual(FULL_CANVAS_LAYOUT.table.minFontSize);
  });

  it("gives Moroccan leagues the template panel layout and others the full canvas", () => {
    expect(defaultLayoutFor(BOTOLA_LEAGUE)).toBe(DEFAULT_LAYOUT);
    expect(defaultLayoutFor(BOTOLA2_LEAGUE)).toBe(DEFAULT_LAYOUT);
    expect(defaultLayoutFor(572)).toBe(FULL_CANVAS_LAYOUT);
  });
});
