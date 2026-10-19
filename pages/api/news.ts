import type { NextApiRequest, NextApiResponse } from "next";
import { fetchNews } from "@/lib/news";
import type { NewsSourceKey } from "@/types/news";

// GET /api/news?source=<key|all>&page=N
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const source = String(req.query.source ?? "all") as NewsSourceKey | "all";
  const refresh = req.query.refresh === "1";
  try {
    const { items, failed } = await fetchNews(page, refresh);
    const filtered = source === "all" ? items : items.filter((i) => i.source === source);
    // The list never needs article text; drop it to keep the payload small.
    const list = filtered.map(({ body, bodyIsHtml, ...rest }) => {
      void body; void bodyIsHtml;
      return rest;
    });
    return res.status(200).json({ items: list, failed, page });
  } catch (e) {
    return res.status(502).json({ error: (e as Error).message, items: [], failed: [] });
  }
}
