/** @jest-environment node */
// The language switch is the app's own words only: data from the feed and the
// exported posters stay Arabic (posters never call t()).
import fs from "fs";
import path from "path";
import { translate } from "../lib/prefs";
import { EN } from "../lib/i18n/en";

describe("translate", () => {
  it("Arabic passes through; English takes the inline text, then the dictionary", () => {
    expect(translate("ar")("نقاط", "Pts")).toBe("نقاط");
    expect(translate("en")("نقاط", "Points")).toBe("Points");
    expect(translate("en")("التصميم")).toBe(EN["التصميم"]);
    expect(translate("en")("نص لم يترجم")).toBe("نص لم يترجم");
  });
});

const root = path.join(__dirname, "..");
const files = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? (d.name === "api" ? [] : files(p)) : /\.tsx$/.test(d.name) ? [p] : [];
  });

// Every UI string written t("…") with no inline English must have an entry,
// or the English app shows Arabic there.
describe("English dictionary", () => {
  const missing = [...files(path.join(root, "pages")), ...files(path.join(root, "components"))].flatMap((f) => {
    const src = fs.readFileSync(f, "utf8");
    return Array.from(src.matchAll(/\bt\("((?:[^"\\]|\\.)*)"\)/g), (m) => m[1])
      .filter((k) => /[؀-ۿ]/.test(k) && !(k in EN))
      .map((k) => `${path.relative(root, f)}: ${k}`);
  });

  it("has every untranslated-at-call-site string", () => {
    expect(missing).toEqual([]);
  });
});

describe("posters stay Arabic", () => {
  const posters = ["MatchdayPoster.tsx", "MoroccanPoster.tsx", "Poster.tsx", "StatsPoster.tsx", "TotwPoster.tsx",
    "live/H2HPoster.tsx", "live/LineupPoster.tsx", "live/MatchStatsPoster.tsx"];
  it.each(posters)("%s does not follow the UI language", (f) => {
    expect(fs.readFileSync(path.join(root, "components", f), "utf8")).not.toMatch(/useLang|lib\/prefs/);
  });
});
