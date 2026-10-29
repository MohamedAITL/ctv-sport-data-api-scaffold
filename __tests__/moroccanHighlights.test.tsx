import { render } from "@testing-library/react";
import { pickHighlights, type MoroccanHighlight } from "../lib/moroccanHighlights";
import MoroccanPoster from "../components/MoroccanPoster";
import { DEFAULT_MOROCCAN_LAYOUT } from "../config/moroccanLayout";
import type { StatCategory } from "../lib/scores365Stats";

const cat = (id: number, name: string, rows: Array<[number, string, string]>): StatCategory => ({
  key: `player-${id}`, kind: "player", name, average: null,
  rows: rows.map(([pid, pname, value], i) => ({ rank: i + 1, id: String(pid), name: pname, value, secondary: null, image: null, clubImage: `crest-${pid}` })),
});
const squad = new Map([
  [10, { id: 10, name: "Hakimi", photo: "https://img/f_png,w_120,h_120,c_limit/Athletes/10" }],
  [20, { id: 20, name: "Bounou", photo: null }],
]);

describe("pickHighlights", () => {
  const boards = [
    { competitionId: 11, categories: [cat(1, "الأهداف", [[99, "X", "12"], [10, "حكيمي", "8"]]), cat(12, "بطاقات صفراء", [[10, "حكيمي", "4"]])] },
    { competitionId: 649, categories: [cat(13, "شباك نظيفة", [[20, "بونو", "5"], [98, "Y", "4"]])] },
  ];
  const list = pickHighlights(boards, squad);

  it("keeps only squad players, keyed competition-category-player", () => {
    expect(list.map((h) => h.key).sort()).toEqual(["11-1-10", "11-12-10", "649-13-20"]);
  });

  it("orders by leaderboard place", () => {
    expect(list.map((h) => h.rank)).toEqual([1, 1, 2]);
    expect(list[list.length - 1].key).toBe("11-1-10");
  });

  it("flags card leaderboards as negative and enlarges the face", () => {
    expect(list.find((h) => h.key === "11-12-10")?.negative).toBe(true);
    expect(list.find((h) => h.key === "11-1-10")?.negative).toBe(false);
    expect(list.find((h) => h.key === "11-1-10")?.photo).toContain("w_400,h_400");
  });
});

const hl = (i: number): MoroccanHighlight => ({
  key: `1-1-${i}`, playerId: i, name: `لاعب ${i}`, photo: null, clubLogo: null, competitionId: 11,
  competition: "الدوري الإسباني", competitionLogo: null, category: "الأهداف", rank: 2, value: String(i), secondary: null, negative: false,
});
const draw = (n: number) =>
  render(<MoroccanPoster highlights={Array.from({ length: n }, (_, i) => hl(i + 1))} layout={DEFAULT_MOROCCAN_LAYOUT} templateSrc={null} />);

describe("MoroccanPoster", () => {
  it("one highlight is a spotlight with its place spelled out", () => {
    const { container } = draw(1);
    expect(container.textContent).toContain("الثاني في الدوري الإسباني");
    expect(container.textContent).not.toContain("#2");
  });

  it("several highlights are a roundup with rank badges", () => {
    const { container, getAllByText } = draw(3);
    expect(getAllByText("#2")).toHaveLength(3);
    expect(container.textContent).not.toContain("الثاني في");
  });

  it("a long roundup ends above lastRowY", () => {
    const { getByText } = draw(15);
    const top = parseFloat((getByText("لاعب 15").style.top));
    expect(top).toBeLessThanOrEqual(DEFAULT_MOROCCAN_LAYOUT.roundup.lastRowY);
  });
});
