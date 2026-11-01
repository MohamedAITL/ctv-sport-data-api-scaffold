import type { NextApiRequest, NextApiResponse } from "next";
import { fetchMoroccansDay } from "@/lib/moroccansToday";
import { inlineUrls } from "@/lib/inlineImage";
import { publicError } from "@/lib/publicError";
import { todayMA } from "@/lib/today";
import type { MoroccanDayRow } from "@/lib/moroccanDay";

const MAX_KEYS = 30;
const KEY = /^\d+-\d+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
// Each read is a request per tagged match, so a day is only worked out once a
// minute, and a finished day barely changes.
const TTL_TODAY_MS = 60_000;
const TTL_PAST_MS = 60 * 60_000;
const cache = new Map<string, { at: number; rows: MoroccanDayRow[] }>();

// GET /api/moroccans/today?date=YYYY-MM-DD
//   Every Morocco international abroad that day, from the real lineups.
// GET /api/moroccans/today?date=…&keys=<key,key,…>
//   Just those rows' faces and crests, inlined for the export.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const raw = typeof req.query.date === "string" ? req.query.date : "";
  const today = todayMA();
  const date = DATE.test(raw) ? raw : today;
  const keys = typeof req.query.keys === "string" && req.query.keys ? req.query.keys.split(",") : null;
  if (keys && (keys.length > MAX_KEYS || keys.some((k) => !KEY.test(k)))) {
    return res.status(400).json({ error: "Bad keys" });
  }

  const hit = cache.get(date);
  const ttl = date === today ? TTL_TODAY_MS : TTL_PAST_MS;
  try {
    const rows = hit && Date.now() - hit.at < ttl ? hit.rows : await fetchMoroccansDay(date, date === today);
    if (rows !== hit?.rows) cache.set(date, { at: Date.now(), rows });
    if (!keys) return res.status(200).json({ rows, fetchedAt: new Date().toISOString() });
    const want = new Set(keys);
    const picked = rows.filter((r) => want.has(r.key));
    const images = await inlineUrls(picked.flatMap((r) => [r.photo, r.clubLogo]));
    const at = (u: string | null) => (u ? images.get(u) ?? null : null);
    return res.status(200).json({ rows: picked.map((r) => ({ key: r.key, photo: at(r.photo), clubLogo: at(r.clubLogo) })) });
  } catch (e) {
    // The last good day rather than a blank screen.
    if (hit && !keys) return res.status(200).json({ rows: hit.rows, stale: true, error: publicError(e) });
    return res.status(502).json({ rows: [], error: publicError(e) });
  }
}
