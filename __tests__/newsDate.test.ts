import { isoOrNow } from "@/lib/news/date";

it("passes a real date through and turns a bad one into now, without throwing", () => {
  expect(isoOrNow("2026-10-21T10:00:00Z")).toBe("2026-10-21T10:00:00.000Z");
  expect(isoOrNow(1792573200000)).toBe(new Date(1792573200000).toISOString());
  for (const bad of ["garbage", "", null, undefined, "2026-13-45"]) {
    expect(() => isoOrNow(bad)).not.toThrow();
    expect(isoOrNow(bad)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  }
});
