import fs from "fs";
import path from "path";
import { fitFont, scorerLines } from "@/components/live/FullTimePoster";
import { BUNDLED_TEMPLATES, MOMENT_BACKGROUNDS } from "@/config/templates";
import { crest, competitionLogo, FACE_IMG } from "@/lib/live365";
import type { Goal } from "@/types/live";

describe("goal and result posters", () => {
  it("every bundled background ships with the app", () => {
    const files = [...Object.values(BUNDLED_TEMPLATES), ...Object.values(MOMENT_BACKGROUNDS).map((b) => b.src)];
    for (const f of files) expect(fs.existsSync(path.join("public", f))).toBe(true);
  });

  it("gives the Saudi league its own background on every poster that has one", () => {
    expect(BUNDLED_TEMPLATES[649]).toBe("/templates/saudi.jpg");
    expect(MOMENT_BACKGROUNDS[649].src).toBe("/templates/saudi.jpg");
  });

  it("gives both Botolas their background on goal and result posters, never on standings", () => {
    expect(MOMENT_BACKGROUNDS[557].src).toBe("/templates/moment-botola.jpg");
    expect(MOMENT_BACKGROUNDS[5651].src).toBe("/templates/moment-botola.jpg");
    expect(BUNDLED_TEMPLATES[557]).toBe("/templates/botola.jpg");
    expect(BUNDLED_TEMPLATES[5651]).toBeUndefined();
  });

  it("shrinks a long name to its width and leaves a short one alone", () => {
    expect(fitFont("ليل", 40, 400)).toBe(40);
    const long = "الدفاع الحسني الجديدي لكرة القدم";
    expect(fitFont(long, 40, 400) * long.length * 0.5).toBeCloseTo(400);
  });

  it("still lists a goal the feed left unnamed", () => {
    const g = { home: true, player: null, minute: "12'", kind: "field" } as unknown as Goal;
    expect(scorerLines([g], true)).toEqual([{ name: "هدف", minutes: "12'" }]);
  });
});

describe("logo images", () => {
  it("are trimmed, so equal boxes show equal logos", () => {
    expect(crest(1, 1)).toContain("/e_trim/");
    expect(competitionLogo(1)).toContain("/e_trim/");
  });

  it("keep the placeholder for a missing crest", () => {
    expect(crest(1, 1)).toContain("d_Competitors:default1.png");
  });

  it("leave player photos uncropped", () => {
    expect(FACE_IMG).not.toContain("e_trim");
  });
});
