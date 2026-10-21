import type { NextApiRequest, NextApiResponse } from "next";
import { fetchPreviousMatches } from "@/lib/live365";
import { fetch365Standings } from "@/lib/scores365";
import { toDataUrl } from "@/lib/inlineImage";
import type { PreviousMatches } from "@/types/live";
import type { TeamRow } from "@/types/standings";

// GET /api/live/previous?game=<id>&matchup=<h-a-c>&home=<id>&away=<id>[&competition=<id>]
// The meetings come from the head-to-head endpoint, which needs the game and
// the matchup; home/away identify which side of each meeting is "ours".
// Loaded only when the tab is opened, and cached: past results and a league
// table do not change between refreshes, so the kiosk's 15s poll must not drag
// them along.
const TTL_MS = 10 * 60 * 1000;
interface Payload { previous: PreviousMatches; table: TeamRow[] }
const cache = new Map<string, { at: number; data: Payload }>();

async function inlineCrests(previous: PreviousMatches): Promise<PreviousMatches> {
  // Every meeting, not just the five the poster shows by default: the row
  // count is editable. Both sides repeat down the list, so this is still two
  // fetches — the Set dedupes before anything is downloaded.
  const rows = previous.h2h;
  const urls = Array.from(new Set(
    rows.flatMap((m) => [m.home.logo, m.away.logo]).filter((u): u is string => Boolean(u))
  ));
  const inlined = new Map<string, string | null>();
  await Promise.all(urls.map(async (u) => inlined.set(u, await toDataUrl(u))));
  const swap = (side: { name: string; score: number | null; logo: string | null }) =>
    ({ ...side, logo: side.logo ? inlined.get(side.logo) ?? null : null });
  return {
    ...previous,
    h2h: rows.map((m) => ({ ...m, home: swap(m.home), away: swap(m.away) })),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const home = Number(req.query.home);
  const away = Number(req.query.away);
  const game = Number(req.query.game);
  const matchup = String(req.query.matchup ?? "");
  if (!Number.isFinite(home) || !Number.isFinite(away) || home <= 0 || away <= 0) {
    return res.status(400).json({ error: "Bad competitor ids" });
  }
  if (!Number.isFinite(game) || !/^\d+-\d+-\d+$/.test(matchup)) {
    return res.status(400).json({ error: "Bad game or matchup id" });
  }
  const competition = Number(req.query.competition);
  // The export needs its crests as data URLs — html-to-image cannot read
  // cross-origin pixels, and a poster with holes where the badges go is worse
  // than no poster. Inlined only when the kiosk asks, so the tab itself stays
  // as quick as it was.
  const inline = req.query.inline === "1";
  const key = `${game}-${home}-${away}-${competition || 0}${inline ? ":inline" : ""}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return res.status(200).json(hit.data);
  try {
    // A cup has no table and a dead table must not cost the meetings.
    const [prev, table] = await Promise.allSettled([
      fetchPreviousMatches(game, matchup, home, away),
      Number.isFinite(competition) && competition > 0
        ? fetch365Standings(competition).then((s) => s.rows)
        : Promise.resolve([] as TeamRow[]),
    ]);
    if (prev.status !== "fulfilled") throw prev.reason;
    const data: Payload = {
      previous: prev.value,
      table: table.status === "fulfilled" ? table.value : [],
    };
    if (inline) data.previous = await inlineCrests(data.previous);
    cache.set(key, { at: Date.now(), data });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: (e as Error).message });
  }
}
