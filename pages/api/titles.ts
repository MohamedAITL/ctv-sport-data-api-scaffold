import type { NextApiRequest, NextApiResponse } from "next";
import { fetchNewsItem } from "@/lib/news";
import { generateTitles, hasAnthropicKey } from "@/lib/titles";
import { generateTitlesOffline } from "@/lib/titlesOffline";

// POST /api/titles { id } — social-post headline suggestions for one article.
// Claude writes them when a key is configured; otherwise they are cut from the
// article's own wording, so the button still works without an account.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const id = String((req.body as { id?: string })?.id ?? "");
  try {
    const item = await fetchNewsItem(id); // enforces the host allowlist
    if (!item) return res.status(404).json({ error: "Unknown article" });

    if (hasAnthropicKey()) {
      try {
        const titles = await generateTitles(item);
        if (titles.length) return res.status(200).json({ titles, engine: "claude" });
      } catch {
        /* fall through to the offline cut rather than failing the click */
      }
    }

    const titles = generateTitlesOffline(item);
    if (titles.length === 0) return res.status(422).json({ error: "No text to work from" });
    return res.status(200).json({ titles, engine: "rules" });
  } catch (e) {
    return res.status(502).json({ error: (e as Error).message });
  }
}
