import { DEFAULT_LAYOUT, zoneColor } from "@/config/defaultLayout";

describe("layout", () => {
  it("default output is exactly 1080x1350", () => {
    expect(DEFAULT_LAYOUT.width).toBe(1080);
    expect(DEFAULT_LAYOUT.height).toBe(1350);
  });

  it("zoneColor colors top, middle, and relegation by rank", () => {
    const z = DEFAULT_LAYOUT.zones; // top 4, bottom 2 of 16
    expect(zoneColor(1, 16, z)).toBe(z.topColor);
    expect(zoneColor(4, 16, z)).toBe(z.topColor);
    expect(zoneColor(8, 16, z)).toBe(z.midColor);
    expect(zoneColor(15, 16, z)).toBe(z.bottomColor);
    expect(zoneColor(16, 16, z)).toBe(z.bottomColor);
  });
});
