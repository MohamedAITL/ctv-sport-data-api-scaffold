import type { NextApiRequest, NextApiResponse } from "next";
import { fetchMoroccanHighlights } from "@/lib/moroccanHighlights";
import { inlineUrls } from "@/lib/inlineImage";
import { publicError } from "@/lib/publicError";

const MAX_KEYS = 40;
const KEY = /^\d+-\d+-\d+$/;

// GET /api/moroccans
//   Every Morocco international in a top-20 leaderboard of a followed
//   competition, images as URLs: the list to pick from.
// GET /api/moroccans?keys=<key,key,…>
//   Just those highlights, faces, crests and logos inlined for the export.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const keys = typeof req.query.keys === "string" && req.query.keys ? req.query.keys.split(",") : null;
  if (keys && (keys.length > MAX_KEYS || keys.some((k) => !KEY.test(k)))) {
    return res.status(400).json({ error: "Bad keys" });
  }
  try {
    const all = await fetchMoroccanHighlights();
    if (!keys) return res.status(200).json({ highlights: all, fetchedAt: new Date().toISOString() });
    const want = new Set(keys);
    const picked = all.filter((h) => want.has(h.key));
    const images = await inlineUrls(picked.flatMap((h) => [h.photo, h.clubLogo, h.competitionLogo]));
    const at = (u: string | null) => (u ? images.get(u) ?? null : null);
    return res.status(200).json({
      highlights: picked.map((h) => ({ ...h, photo: at(h.photo), clubLogo: at(h.clubLogo), competitionLogo: at(h.competitionLogo) })),
    });
  } catch (e) {
    return res.status(502).json({ highlights: [], error: publicError(e) });
  }
}
