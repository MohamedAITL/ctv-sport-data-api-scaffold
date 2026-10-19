// Short Arabic headline suggestions for social posts, written by Claude from the
// article we already fetched. The API key is read server-side only.
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-5-5";
const MAX_SOURCE_CHARS = 6000;

export const hasAnthropicKey = (): boolean => Boolean(process.env.ANTHROPIC_API_KEY);

const SYSTEM = `أنت محرر عناوين في قناة رياضية مغربية (شوف تي في).
اكتب عناوين قصيرة وجذابة بالعربية الفصحى لنشرها على مواقع التواصل الاجتماعي.

القواعد:
- اكتب 5 عناوين مختلفة.
- كل عنوان في سطر مستقل، بدون ترقيم وبدون شرطات وبدون علامات اقتباس.
- كل عنوان أقل من 70 حرفا.
- بدون هاشتاغ وبدون إيموجي.
- اعتمد فقط على معلومات المقال، ولا تخترع أي معلومة أو رقم.
- نوّع الأسلوب: خبري مباشر، وآخر يبرز التصريح أو الرقم الأهم.
- لا تكتب أي نص آخر غير العناوين.`;

export async function generateTitles(article: {
  title?: string | null;
  body?: string | null;
  summary?: string | null;
}): Promise<string[]> {
  const source = [article.title ?? "", article.body || article.summary || ""]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, MAX_SOURCE_CHARS);
  if (!source.trim()) return [];

  const client = new Anthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    output_config: { effort: "low" }, // a headline is not a reasoning task
    system: SYSTEM,
    messages: [{ role: "user", content: source }],
  });

  // Thinking is on by default on this model, so take the text blocks only.
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return text
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^["'«»]|["'«»]$/g, "").trim())
    .filter((l) => l.length > 8 && l.length < 160)
    .slice(0, 5);
}
