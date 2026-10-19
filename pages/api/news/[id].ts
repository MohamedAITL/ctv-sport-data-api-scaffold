import type { NextApiRequest, NextApiResponse } from "next";
import { fetchNewsItem } from "@/lib/news";

// GET /api/news/<id> — one article plus its body where the publisher provides it.
// The id decodes to a URL, so `fetchNewsItem` enforces the host allowlist.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = String(req.query.id ?? "");
  try {
    const item = await fetchNewsItem(id);
    if (!item) return res.status(404).json({ error: "Unknown or unsupported article" });
    return res.status(200).json({ item });
  } catch (e) {
    return res.status(502).json({ error: (e as Error).message });
  }
}
