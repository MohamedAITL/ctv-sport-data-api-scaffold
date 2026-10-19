// Social headline suggestions without an API key.
//
// This cannot invent new phrasing — it shortens and re-cuts what the publisher
// already wrote: drops the "رسميا/" style kicker, splits on the separators Arabic
// sports headlines use, and offers the article's opening sentence. For long
// agency headlines that is usually the edit you want anyway.

const MAX = 70;
const MIN = 18;

// Kickers Moroccan sports desks put before the real headline.
const KICKER = /^\s*(?:رسميا|عاجل|خاص|حصري|فيديو|صور|بالفيديو|بالصور|تقرير|مباشر)\s*[\/:،\-–—]\s*/;

const tidy = (s: string): string =>
  s
    .replace(/\s+/g, " ")
    .replace(/^[\s"'«»\-–—:،.]+|[\s"'«»\-–—:،]+$/g, "")
    .trim();

// A candidate cut from mid-sentence reads as garbage ("00 غرينيتش)، بخصوص…").
// Reject the tell-tale shapes rather than trying to split perfectly.
function looksLikeFragment(s: string): boolean {
  if (/^[\d(){}\[\]"'«»،.,:;!?\-]/.test(s)) return true; // starts on a digit or punctuation
  const open = (s.match(/[("«]/g) || []).length;
  const close = (s.match(/[)"»]/g) || []).length;
  return close > open; // a closing bracket whose opener was cut away
}

/** Cut to MAX chars on a word boundary rather than mid-word. */
function clamp(s: string): string {
  const t = tidy(s);
  if (t.length <= MAX) return t;
  const cut = t.slice(0, MAX + 1);
  const sp = cut.lastIndexOf(" ");
  return tidy(sp > MIN ? cut.slice(0, sp) : t.slice(0, MAX));
}

export function generateTitlesOffline(article: {
  title?: string | null;
  body?: string | null;
  summary?: string | null;
}): string[] {
  const title = tidy(article.title ?? "");
  const text = tidy((article.body ?? "").replace(/<[^>]+>/g, " ") || (article.summary ?? ""));
  const out: string[] = [];
  const add = (s: string) => {
    const v = clamp(s);
    if (v.length >= MIN && !looksLikeFragment(v) && !out.some((o) => o === v)) out.push(v);
  };

  if (title) {
    const noKicker = tidy(title.replace(KICKER, ""));
    add(noKicker || title);

    // The clause before the first strong separator is usually the core claim.
    const head = noKicker.split(/\s[\-–—:]\s|[:،]\s|\.\.+/)[0];
    if (head && head.length >= MIN) add(head);

    // ...and after it, the consequence ("X بسبب الإصابة").
    const parts = noKicker.split(/\s[\-–—:]\s|[:،]\s/);
    if (parts.length > 1) add(parts.slice(1).join(" "));

    if (noKicker !== title) add(title); // keep the kicker version as an option
  }

  if (text) {
    const first = text.split(/(?<=[.!؟])(?!\d)\s+|(?<=[.!؟])(?=[؀-ۿ])/)[0];
    if (first) add(first);
    const quote = text.match(/[":«]\s*([^"»]{20,90})\s*["»]/);
    if (quote?.[1]) add(quote[1]);
  }

  return out.slice(0, 5);
}
