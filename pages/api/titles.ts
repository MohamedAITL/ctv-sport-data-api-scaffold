import type { NextApiRequest, NextApiResponse } from "next";
import { fetchNewsItem } from "@/lib/news";
import { generateTitles, hasAnthropicKey } from "@/lib/titles";

// POST /api/titles { id } — social-post headline suggestions for one article.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  if (!hasAnthropicKey())
    return res.status(400).json({ error: "ANTHROPIC_API_KEY is not set in .env.local" });

  const id = String((req.body as { id?: string })?.id ?? "");
  try {
    const item = await fetchNewsItem(id); // enforces the host allowlist
    if (!item) return res.status(404).json({ error: "Unknown article" });
    const titles = await generateTitles(item);
    if (titles.length === 0) return res.status(422).json({ error: "No text to work from" });
    return res.status(200).json({ titles });
  } catch (e) {
    return res.status(502).json({ error: (e as Error).message });
  }
}
