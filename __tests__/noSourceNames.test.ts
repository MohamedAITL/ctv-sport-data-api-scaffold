import fs from "fs";
import path from "path";
import { maskSources } from "../lib/publicError";
import { NEWS_SOURCES, sourceName } from "../types/news";

// The app never names its data sources on screen. Code may (identifiers,
// comments, fetch URLs); text a user can read may not. "البطولة", "Goal" and
// "الرياضة" are left out: they are also ordinary words and league names.
const NAMES = /365\s?scores|hesport|hespress|elbotola|kooora|هسبورت|هسبريس|كووورة|بي إن سبورت|سكاي نيوز/i;

const files = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? (d.name === "api" ? [] : files(p)) : /\.tsx$/.test(d.name) ? [p] : [];
  });

// Everything a user could read: string literals and JSX text, once comments,
// imports and URLs are gone.
const visibleText = (src: string): string[] => {
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/^import .*$/gm, "")
    .replace(/https?:\/\/[^\s"'`]+/g, "");
  const strings = code.match(/"[^"\n]*"|'[^'\n]*'|`[^`]*`/g) ?? [];
  // JSX text runs between tags and expressions: >text<, }text{, >text{ …
  const jsxText = code.match(/[>}][^<>{}]+[<{]/g) ?? [];
  return [...strings, ...jsxText];
};

describe("no data-source names on screen", () => {
  const root = path.join(__dirname, "..");
  const all = [...files(path.join(root, "pages")), ...files(path.join(root, "components"))];

  it.each(all.map((f) => [path.relative(root, f), f]))("%s", (_rel, file) => {
    const hits = visibleText(fs.readFileSync(file, "utf8")).filter((t) => NAMES.test(t));
    expect(hits).toEqual([]);
  });

  it("news sources are numbered, never named", () => {
    expect(NEWS_SOURCES.map((k) => sourceName(k))).toEqual(NEWS_SOURCES.map((_, i) => `مصدر ${i + 1}`));
  });

  it("API errors are masked before they reach the browser", () => {
    expect(maskSources("365scores 502 for /games/allScores")).toBe("المصدر 502 for /games/allScores");
    expect(maskSources("kooora: no __NEXT_DATA__")).toBe("المصدر: no __NEXT_DATA__");
    expect(maskSources("beIN 403")).toBe("المصدر 403");
  });
});
