import type { LiveMatch } from "@/types/live";

const TASHKEEL = /[ً-ٰٟـ]/g;

/** Spelling folded, so "الاهلي" finds "الأهلي" and "Real" finds "real". */
export const normalise = (s: string): string =>
  s.toLowerCase()
    .replace(TASHKEEL, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();

/** Every word must appear in the teams, the competition or a tagged Moroccan. */
export function searchMatches(matches: LiveMatch[], query: string): LiveMatch[] {
  const words = normalise(query).split(" ").filter(Boolean);
  if (words.length === 0) return matches;
  return matches.filter((m) => {
    const hay = normalise([m.home.name, m.away.name, m.competition, ...(m.moroccans ?? []).map((p) => p.name)].join(" "));
    return words.every((w) => hay.includes(w));
  });
}
