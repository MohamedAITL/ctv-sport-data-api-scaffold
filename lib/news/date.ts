// `new Date(bad).toISOString()` throws, and it runs per item: one malformed date
// in a feed would drop that publisher's whole list. A bad date means "now".
export function isoOrNow(value: string | number | null | undefined): string {
  const d = value === null || value === undefined || value === "" ? null : new Date(value);
  return d && !Number.isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
}
