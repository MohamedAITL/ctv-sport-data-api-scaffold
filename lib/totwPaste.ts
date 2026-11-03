// A team of the round pasted as text, matched to the round's own players.
//
// The text is whatever was copied from a page that shows a team: names and
// ratings, in any layout, in Latin letters or Arabic. Nothing here trusts that
// layout. Each line is matched by name against everyone who played the round,
// helped by a club line next to it when the copy has one. Each player's row
// comes from his position in his own match; within a row the copy runs right to
// left, as the widget's text does (keeper first, then each row from the back).
import { normalise } from "./searchMatches";
import { formationSlots, type TotwPlayer } from "./totw";

export interface PastedTeam {
  formation: string;
  /** Slot index (as `formationSlots` numbers them) → player id. */
  slots: Record<number, number>;
  ratings: Record<number, number>;
  found: number;
  /** Lines that looked like a name but matched nobody, or several players equally. */
  missed: string[];
}

// "10" alone is a shirt number; a rating always has its decimal.
const RATING = /(?:^|[^\d.,])(10[.,]0|[3-9][.,]\d)(?![\d.,])/g;
// Particles every other name shares: a match on these alone proves nothing.
const WEAK = new Set(["el", "al", "ben", "bin", "ibn", "abu", "de", "da", "di", "la", "le", "van", "von", "jr", "ال", "بن", "ابن", "ابو"]);
// Words a copied team carries besides the players.
// The page's own name is among them, and must never be echoed back as "not found".
const NOISE = /team of the (week|round)|round|matchday|botola|formation|\bpro\b|rating|provided|powered|sofa\s?score|never miss|see (much )?more|تشكيله الجوله|الجوله|البطوله|التقييم/i;

// Names reach us spelled two ways: our data's own Latin and Arabic, and the page's
// French-style Latin ("Rhabra" is غبرة, "Serrhat" is سرغات). Their consonants agree.
const AR: Record<string, string> = {
  "ب": "b", "ت": "t", "ث": "t", "ج": "j", "ح": "h", "خ": "k", "د": "d", "ذ": "d", "ر": "r", "ز": "z", "س": "s", "ش": "s",
  "ص": "s", "ض": "d", "ط": "t", "ظ": "z", "غ": "g", "ف": "f", "ق": "k", "ك": "k", "ل": "l", "م": "m", "ن": "n", "ه": "h",
};
const arSkeleton = (w: string) => Array.from(w.replace(/^ال/, ""), (c) => AR[c] ?? "").join("").replace(/(.)\1+/g, "$1");
const latinSkeleton = (w: string) => w.replace(/rh|gh/g, "g").replace(/kh/g, "k").replace(/ch|sh/g, "s").replace(/th/g, "t").replace(/dj/g, "j")
  .replace(/[qc]/g, "k").replace(/[aeiouyw]/g, "").replace(/(.)\1+/g, "$1");
// The Latin letters an Arabic first name can start with.
const AR_INITIAL: Record<string, string> = {
  "ا": "aeiou", "أ": "aeiou", "إ": "ei", "آ": "a", "ع": "aeiou", "ي": "yi", "و": "wo", "ج": "jg", "غ": "gr", "ش": "sc", "خ": "kh", "ق": "kq",
};
const arInitials = (w: string) => AR_INITIAL[w.charAt(0)] ?? AR[w.charAt(0)] ?? "";

const latin = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z؀-ۿ]+/g, " ").trim();
const words = (s: string) => latin(normalise(s)).split(" ").filter((w) => w.length >= 2);

type Row = "G" | "D" | "M" | "F";
const rowOf = (p: TotwPlayer): Row => {
  const pos = p.position ?? "";
  if (/حارس/.test(pos) || p.line === 0) return "G";
  if (/دفاع|مدافع/.test(pos)) return "D";
  if (/وسط/.test(pos)) return "M";
  if (/هجوم|مهاجم/.test(pos)) return "F";
  const line = p.line ?? 50;
  return line < 40 ? "D" : line < 75 ? "M" : "F";
};

// Words every club name shares: "RS", "Athletic Club", "Union Sport"...
const CLUB_WEAK = new Set(["fc", "ac", "as", "cs", "sc", "rs", "us", "club", "athletic", "athletique", "sport", "sports", "sportif", "union", "de", "du", "la", "le", "el", "al"]);
/** The round's clubs a line names: by a word of their Latin name, or by its initials ("Fath Union Sport" is FUS). */
function clubsNamed(line: string, players: TotwPlayer[]): Set<number> {
  const ws = words(line);
  const acronym = ws.map((w) => w.charAt(0)).join("");
  const out = new Set<number>();
  for (const p of players) {
    const c = p.club;
    if (!c || out.has(c.id)) continue;
    const tokens = words((c.slug ?? "").replace(/-/g, " ")).filter((t) => !CLUB_WEAK.has(t));
    if (tokens.some((t) => ws.includes(t) || (t.length >= 3 && t === acronym))) out.add(c.id);
  }
  return out;
}

interface Known { own: Set<string>; surname?: string; skeletons: Set<string>; initials: string }
const known = new WeakMap<TotwPlayer, Known>();
function knownOf(p: TotwPlayer): Known {
  let k = known.get(p);
  if (!k) {
    const slug = words((p.slug ?? "").replace(/-/g, " "));
    const arabic = p.name.split(/\s+/).filter(Boolean);
    k = {
      own: new Set([...slug, ...words(p.name), ...words(p.shortName)]),
      surname: slug.filter((w) => !WEAK.has(w)).pop(),
      skeletons: new Set([...slug.map(latinSkeleton), ...arabic.map(arSkeleton)].filter((x) => x.length >= 3)),
      initials: (slug[0]?.charAt(0) ?? "") + arInitials(arabic[0] ?? ""),
    };
    known.set(p, k);
  }
  return k;
}

/**
 * How well a line names a player: a surname or a strong word must match, by
 * spelling or, failing that, by its consonants; an initial settles shared surnames.
 */
function score(line: string[], initials: string[], p: TotwPlayer): number {
  const k = knownOf(p);
  let s = 0, strong = false, sounded = false;
  for (const w of line) {
    if (k.own.has(w)) {
      if (WEAK.has(w)) { s += .3; continue; }
      s += w === k.surname ? 1.5 : 1;
      if (w.length >= 3) strong = true;
    } else if (!sounded && !WEAK.has(w) && k.skeletons.has(latinSkeleton(w))) {
      s += .8; strong = true; sounded = true; // counted once: one word, two spellings
    }
  }
  if (strong && initials.some((i) => k.initials.includes(i))) s += .5;
  return strong ? s : 0;
}

/**
 * The pasted team, as picks for the studio. `fallback` is the formation to
 * fill when fewer than eleven were found, since the missing ones' rows are unknown.
 */
export function matchPasted(text: string, players: TotwPlayer[], fallback = "4-3-3"): PastedTeam {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const nums = lines.map((l) => Array.from(l.matchAll(RATING), (m) => Number(m[1].replace(",", "."))));
  const onlyNumber = lines.map((l) => /^[\d.,\s]+$/.test(l));
  const used = new Set<number>();
  // A line naming a club is the club of the player beside it, never a player.
  const clubs = lines.map((l, i) => (onlyNumber[i] ? new Set<number>() : clubsNamed(l, players)));
  const best = new Map<number, { score: number; line: number }>();
  const missed: string[] = [];

  lines.forEach((l, i) => {
    if (onlyNumber[i] || clubs[i].size > 0 || NOISE.test(latin(normalise(l)))) return;
    const near = clubs[i + 1]?.size ? clubs[i + 1] : clubs[i - 1] ?? new Set<number>();
    const ws = words(l.replace(RATING, " "));
    if (ws.length === 0) return;
    const initials = latin(l.replace(RATING, " ")).split(" ").filter((w) => w.length === 1);
    const ranked = players.map((p) => { const s = score(ws, initials, p); return { p, s: s && p.club && near.has(p.club.id) ? s + 1 : s }; }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    if (ranked.length === 0 || (ranked[1] && ranked[1].s === ranked[0].s)) {
      if (ws.some((w) => w.length >= 3 && !WEAK.has(w))) missed.push(l);
      return;
    }
    const { p, s } = ranked[0];
    const prev = best.get(p.id);
    if (!prev || s > prev.score) best.set(p.id, { score: s, line: i });
  });

  // A rating sits on the name's own line, or alone just before or after it.
  const ratings: Record<number, number> = {};
  for (const [id, { line }] of Array.from(best.entries())) {
    const near = [line, line - 1, line + 1].find((j) => nums[j]?.length && (j === line || (onlyNumber[j] && !used.has(j))));
    if (near === undefined) continue;
    if (near !== line) used.add(near);
    ratings[id] = nums[near][nums[near].length - 1];
  }

  const at = (p: TotwPlayer) => best.get(p.id)?.line ?? 0;
  const chosen = Array.from(best.entries()).sort((a, b) => b[1].score - a[1].score).slice(0, 11)
    .map(([id]) => players.find((p) => p.id === id) as TotwPlayer);
  const by = (r: Row) => chosen.filter((p) => rowOf(p) === r);
  const [g, d, m, f] = [by("G"), by("D"), by("M"), by("F")];
  const complete = chosen.length === 11 && g.length === 1 && d.length > 0 && m.length > 0 && f.length > 0;
  const formation = complete ? `${d.length}-${m.length}-${f.length}` : fallback;

  // Rows of the formation, back to front: the first is the defence, the last the attack.
  const spots = formationSlots(formation).map((s, i) => ({ ...s, i }));
  const lines_ = Array.from(new Set(spots.slice(1).map((s) => s.line))).sort((a, b) => a - b);
  const rowFor = (k: number): Row => (k === 0 ? "D" : k === lines_.length - 1 ? "F" : "M");
  const slots: Record<number, number> = {};
  if (g[0]) slots[0] = g[0].id;
  for (const r of ["D", "M", "F"] as Row[]) {
    const queue = (r === "D" ? d : r === "M" ? m : f).slice().sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
    lines_.forEach((line, k) => {
      if (rowFor(k) !== r) return;
      const row = spots.filter((s) => s.line === line).sort((a, b) => a.side - b.side);
      // The copy lists a row right to left: its first player stands on the right.
      const here = queue.splice(0, row.length).sort((a, b) => at(b) - at(a));
      here.forEach((p, j) => { slots[row[j].i] = p.id; });
    });
  }
  // Anyone left over (more in a line than the fallback has room for) takes a free slot.
  const placed = new Set(Object.values(slots));
  const free = spots.slice(1).map((s) => s.i).filter((i) => slots[i] === undefined);
  for (const p of chosen) if (!placed.has(p.id) && rowOf(p) !== "G" && free.length) slots[free.shift() as number] = p.id;

  return { formation, slots, ratings, found: Object.keys(slots).length, missed };
}

/**
 * The address inside an embed code (or the address itself), for showing the
 * widget next to the poster. Only a secure embed page is accepted.
 */
export function embedSrc(code: string): string | null {
  const raw = (code.match(/src\s*=\s*["']([^"']+)["']/i)?.[1] ?? code).trim().replace(/&amp;/g, "&");
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && /\/embed\//.test(u.pathname) ? u.toString() : null;
  } catch {
    return null;
  }
}
