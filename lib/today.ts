// The channel's day is Morocco's. At 00:30 in Casablanca the UTC date is still
// yesterday, so "today" from toISOString() labelled the wrong day for an hour
// every night and the day-stepping skipped one.
const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Casablanca", year: "numeric", month: "2-digit", day: "2-digit",
});

/** YYYY-MM-DD in Casablanca. */
export const todayMA = (now: Date = new Date()): string => fmt.format(now);
