// Social headline suggestions without an API key.
//
// This cannot invent new phrasing — it shortens and re-cuts what the publisher
// already wrote: drops the "رسميا/" style kicker, splits on the separators Arabic
// sports headlines use, and offers the article's opening sentence. For long
// agency headlines that is usually the edit you want anyway.

const MAX = 70;
const MIN = 24;
const WANTED = 10;

// Kickers Moroccan sports desks put before the real headline.
const KICKER = /^\s*(?:رسميا|عاجل|خاص|حصري|فيديو|صور|بالفيديو|بالصور|تقرير|مباشر)\s*[\/:،\-–—]\s*/;

// Compare suggestions ignoring punctuation and spacing.
const norm = (s: string): string => s.replace(/[\s"'«»().,:;!?،؟\-–—]/g, "");

const tidy = (s: string): string =>
  s
    .replace(/\s+/g, " ")
    .replace(/^[\s"'«»\-–—:،.]+|[\s"'«»\-–—:،]+$/g, "")
    .trim();

// A candidate cut from mid-sentence reads as garbage ("00 غرينيتش)، بخصوص…").
// Reject the tell-tale shapes rather than trying to split perfectly.
// Arabic clauses that trail off on a connector or an attribution verb read as
// half a sentence ("وعن المقارنة، أضاف"), never as a headline.
const DANGLING = /(?:\s|^)(?:أضاف|قال|وقال|أوضح|وأوضح|قائلا|مضيفا|وتابع|تابع|وأكمل|أكمل|وفي|في|من|على|عن|إلى|بعد|قبل|التي|الذي|كما|مع|ضد|و)$/;

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
    if (out.length >= WANTED) return;
    const v = clamp(s);
    if (v.length < MIN || looksLikeFragment(v) || DANGLING.test(v)) return;
    // Two cuts that differ only by a stray quote or comma are the same headline.
    const key = norm(v);
    if (out.some((o) => norm(o) === key)) return;
    out.push(v);
  };

  const SEP = /\s[\-–—:]\s|[:،]\s|\.\.+/;

  if (title) {
    const noKicker = tidy(title.replace(KICKER, ""));
    add(noKicker || title);

    // Each clause of the headline stands on its own as a shorter angle.
    const parts = noKicker.split(SEP).map(tidy).filter(Boolean);
    if (parts.length > 1) {
      add(parts[0]);                    // the core claim
      add(parts.slice(1).join(" "));    // the consequence
      for (const p of parts.slice(1)) add(p);
    }

    // Drop a trailing "و..." qualifier — often half the length, same story.
    const trimmedTail = noKicker.replace(/\sو[^و]{10,}$/, "");
    if (trimmedTail !== noKicker) add(trimmedTail);

    if (noKicker !== title) add(title); // the kicker version, kept as an option
  }

  if (text) {
    // Opening sentences carry the lede; quotes make strong social headlines.
    const sentences = text
      .split(/(?<=[.!؟])(?!\d)\s+|(?<=[.!؟])(?=[؀-ۿ])/)
      .map(tidy)
      .filter((x) => x.length >= MIN);
    // A body sentence usually opens with the "و" connector; without it the
    // sentence reads as a headline.
    const unlead = (x: string) => tidy(x.replace(/^\u0648(?=[\u0600-\u06FF])/, ""));
    for (const sn of sentences.slice(0, 5)) add(unlead(sn));

    const quotes = text.match(/[":«]\s*([^"»]{20,90})\s*["»]/g) ?? [];
    for (const q of quotes.slice(0, 3)) add(tidy(q.replace(/^[":«]|["»]$/g, "")));

    // The clause before a quote is usually "X يصرح:" — a usable headline too.
    for (const sn of sentences.slice(0, 4)) {
      const lead = tidy(sn.split(/[":\u00ab]/)[0]).replace(/^\u0648(?=[\u0600-\u06FF])/, "");
      if (lead && lead.length >= MIN) add(lead);
    }
  }

  return out.slice(0, WANTED);
}
