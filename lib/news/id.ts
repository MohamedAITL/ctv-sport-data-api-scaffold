// Article ids are base64url of the article URL, so the detail route is stateless
// (it never depends on a cache entry surviving between serverless invocations).
//
// That makes the id an arbitrary URL supplied by the caller, so decoding MUST be
// paired with the host allowlist below before anything is fetched — otherwise the
// route is an open server-side fetch primitive (SSRF).
import type { NewsSourceKey } from "@/types/news";

const ALLOWED_HOSTS = [
  "hesport.com",
  "elbotola.com",
  "kooora.com",
  "365scores.com",
];

export function encodeNewsId(url: string): string {
  return Buffer.from(url, "utf8").toString("base64url");
}

export function decodeNewsId(id: string): string | null {
  try {
    const url = Buffer.from(id, "base64url").toString("utf8");
    return isAllowedArticleUrl(url) ? url : null;
  } catch {
    return null;
  }
}

export function isAllowedArticleUrl(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  const host = u.hostname.toLowerCase();
  return ALLOWED_HOSTS.some((h) => host === h || host.endsWith("." + h));
}

export function sourceOfUrl(url: string): NewsSourceKey | null {
  const h = (() => { try { return new URL(url).hostname.toLowerCase(); } catch { return ""; } })();
  if (h.endsWith("hesport.com")) return "hesport";
  if (h.endsWith("elbotola.com")) return "elbotola";
  if (h.endsWith("kooora.com")) return "kooora";
  if (h.endsWith("365scores.com")) return "scores365";
  return null;
}
