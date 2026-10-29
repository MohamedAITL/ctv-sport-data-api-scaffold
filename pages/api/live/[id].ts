import type { NextApiRequest, NextApiResponse } from "next";
import { fetchLiveDetail } from "@/lib/live365";
import { inlineImages, toDataUrl } from "@/lib/inlineImage";
import type { LineupPlayer, LiveDetail, TeamLineup } from "@/types/live";
import { publicError } from "@/lib/publicError";

// The lineups poster needs the crests and the faces as data URLs — html-to-
// image cannot read cross-origin pixels. The benches too: any substitute can
// be swapped into the XI before export. The helper batches each list, so the
// CDN never sees more than a chunk at once per team.
async function inlineForPoster(d: LiveDetail): Promise<LiveDetail> {
  const faces = (list: LineupPlayer[]) => inlineImages(list, (p) => p.photo, (p, photo) => ({ ...p, photo }));
  const xi = async (lu: TeamLineup | null) =>
    lu && { ...lu, starting: await faces(lu.starting), bench: await faces(lu.bench) };
  const [homeLogo, awayLogo] = await Promise.all([toDataUrl(d.match.home.logo), toDataUrl(d.match.away.logo)]);
  const homeLineup = await xi(d.homeLineup);
  const awayLineup = await xi(d.awayLineup);
  return {
    ...d,
    match: { ...d.match, home: { ...d.match.home, logo: homeLogo }, away: { ...d.match.away, logo: awayLogo } },
    homeLineup,
    awayLineup,
  };
}

// GET /api/live/<gameId>?matchup=<home-away-competition>[&inline=1]
// The matchup id is what unlocks lineups, events and members upstream.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = Number(req.query.id);
  const matchup = String(req.query.matchup ?? "");
  if (!Number.isFinite(id) || !/^\d+-\d+-\d+$/.test(matchup)) {
    return res.status(400).json({ error: "Bad game id or matchup id" });
  }
  try {
    const detail = await fetchLiveDetail(id, matchup);
    if (!detail) return res.status(404).json({ error: "Match not found" });
    const out = req.query.inline === "1" ? await inlineForPoster(detail) : detail;
    return res.status(200).json({ detail: out, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(502).json({ error: publicError(e) });
  }
}
