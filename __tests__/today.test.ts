import { todayMA } from "@/lib/today";

it("gives Morocco's date, not UTC's, around midnight", () => {
  // 23:30 UTC on the 21st is already 00:30 on the 22nd in Casablanca (UTC+1).
  expect(todayMA(new Date("2026-10-21T23:30:00Z"))).toBe("2026-10-22");
  expect(todayMA(new Date("2026-10-21T12:00:00Z"))).toBe("2026-10-21");
  expect(todayMA()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});
