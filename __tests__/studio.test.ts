/** @jest-environment node */
// The Studio design lives in one stylesheet that must never leak into the
// classic design, and its colour pairs must stay readable in both themes.
import fs from "fs";
import path from "path";

const css = fs.readFileSync(path.join(__dirname, "..", "styles", "studio.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Every style rule's selector list, descending into @media and skipping @keyframes. */
function selectors(src: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf("{", i);
    if (open < 0) break;
    const head = src.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (depth > 0) { if (src[j] === "{") depth++; if (src[j] === "}") depth--; j++; }
    if (head.startsWith("@media")) out.push(...selectors(src.slice(open + 1, j - 1)));
    else if (!head.startsWith("@keyframes")) out.push(...head.split(/,(?![^(]*\))/).map((s) => s.trim()));
    i = j;
  }
  return out;
}

describe("studio.css", () => {
  const all = selectors(css);
  it("finds the rules", () => expect(all.length).toBeGreaterThan(200));
  it("scopes every selector to the Studio design", () => {
    expect(all.filter((s) => !s.startsWith(':root[data-design="studio"]'))).toEqual([]);
  });
  it("names its keyframes so they cannot replace a classic animation", () => {
    const names = Array.from(css.matchAll(/@keyframes\s+([\w-]+)/g), (m) => m[1]);
    expect(names.length).toBeGreaterThan(0);
    expect(names.filter((n) => !n.startsWith("studio-"))).toEqual([]);
  });
  it("never freezes an animation with `both`, which breaks fixed children", () => {
    expect(css).not.toMatch(/animation[^;]*\bboth\b/);
  });
});

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Token values of one block, by its exact selector suffix. */
function tokens(suffix: string): Record<string, string> {
  const at = css.indexOf(`:root[data-design="studio"]${suffix} {`);
  expect(at).toBeGreaterThanOrEqual(0);
  const body = css.slice(css.indexOf("{", at) + 1, css.indexOf("}", at));
  return Object.fromEntries(Array.from(body.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})/g), (m) => [m[1], m[2]]));
}

describe("contrast reaches 4.5:1", () => {
  const dark = tokens("");
  const light = { ...dark, ...tokens('[data-theme="light"]') };
  const sections = ["round", "matchday", "stats", "news", "live"];
  const band = "#3f254c";

  it.each([["dark", dark], ["light", light]] as const)("text and muted on every %s surface", (_, v) => {
    for (const fg of ["--text", "--muted", "--live-text", "--ok", "--warn", "--danger"]) {
      for (const bg of ["--bg", "--bg-2", "--panel", "--panel-2"]) {
        expect([fg, bg, contrast(v[fg], v[bg]) >= 4.5]).toEqual([fg, bg, true]);
      }
    }
    expect(contrast(v["--text"], v["--panel-3"])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(sections)("the %s tab: ink on its fill, its text on panels", (s) => {
    const own = tokens(`[data-section="${s}"]`);
    expect(contrast(own["--sec-ink"], own["--sec"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(own["--sec-text"], dark["--panel"])).toBeGreaterThanOrEqual(4.5);
    const lightText = tokens(`[data-theme="light"][data-section="${s}"]`)["--sec-text"];
    expect(contrast(lightText, light["--panel"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(lightText, light["--panel-2"])).toBeGreaterThanOrEqual(4.5);
  });

  it("the default tab, and white on the header band", () => {
    expect(contrast(dark["--sec-ink"], dark["--sec"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(light["--sec-text"], light["--panel"])).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#ffffff", band)).toBeGreaterThanOrEqual(4.5);
    for (const k of ["--tab-standings", "--tab-round", "--tab-matchday", "--tab-stats", "--tab-news", "--tab-live"]) {
      expect([k, contrast(dark[k], band) >= 3]).toEqual([k, true]);
    }
  });
});
