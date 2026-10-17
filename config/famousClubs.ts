// Curated club fame weights + Arabic names. No team-popularity field exists in
// the API, so this drives "most famous match" ranking (match fame = home + away
// weight) and gives Arabic names for the big clubs automatically. First match
// wins; unknown clubs get BASE_WEIGHT and keep their API (English) name.
export const BASE_WEIGHT = 1;

export interface Club {
  keys: string[]; // normalized substrings to match against the team name
  ar: string;
  w: number;
}

export const FAMOUS_CLUBS: Club[] = [
  { keys: ["real madrid"], ar: "ريال مدريد", w: 10 },
  { keys: ["barcelona", "barca"], ar: "برشلونة", w: 10 },
  { keys: ["atletico"], ar: "أتلتيكو مدريد", w: 7 },
  { keys: ["manchester city", "man city"], ar: "مانشستر سيتي", w: 10 },
  { keys: ["manchester united", "manchester utd", "man utd", "man united"], ar: "مانشستر يونايتد", w: 10 },
  { keys: ["liverpool"], ar: "ليفربول", w: 10 },
  { keys: ["arsenal"], ar: "أرسنال", w: 9 },
  { keys: ["chelsea"], ar: "تشيلسي", w: 9 },
  { keys: ["tottenham", "spurs"], ar: "توتنهام", w: 7 },
  { keys: ["newcastle"], ar: "نيوكاسل", w: 6 },
  { keys: ["aston villa"], ar: "أستون فيلا", w: 6 },
  { keys: ["bayern"], ar: "بايرن ميونخ", w: 10 },
  { keys: ["dortmund"], ar: "بوروسيا دورتموند", w: 8 },
  { keys: ["leipzig"], ar: "لايبزيغ", w: 6 },
  { keys: ["leverkusen"], ar: "باير ليفركوزن", w: 7 },
  { keys: ["paris saint", "paris sg", "psg"], ar: "باريس سان جيرمان", w: 10 },
  { keys: ["marseille"], ar: "مارسيليا", w: 7 },
  { keys: ["monaco"], ar: "موناكو", w: 6 },
  { keys: ["lyon"], ar: "ليون", w: 6 },
  { keys: ["juventus"], ar: "يوفنتوس", w: 9 },
  { keys: ["inter"], ar: "إنتر ميلان", w: 9 },
  { keys: ["ac milan", "a.c. milan", "milan"], ar: "ميلان", w: 9 },
  { keys: ["napoli"], ar: "نابولي", w: 8 },
  { keys: ["roma"], ar: "روما", w: 7 },
  { keys: ["lazio"], ar: "لاتسيو", w: 6 },
  { keys: ["atalanta"], ar: "أتالانتا", w: 6 },
  { keys: ["benfica"], ar: "بنفيكا", w: 6 },
  { keys: ["porto"], ar: "بورتو", w: 6 },
  { keys: ["sporting"], ar: "سبورتينغ لشبونة", w: 6 },
  { keys: ["ajax"], ar: "أياكس", w: 6 },
];

export function normName(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[^a-z0-9 ]/g, "").trim();
}

// Returns { ar, w } for a team name, or null if not a listed famous club.
export function famousClub(name: string): { ar: string; w: number } | null {
  const n = normName(name);
  for (const c of FAMOUS_CLUBS) if (c.keys.some((k) => n.includes(k))) return { ar: c.ar, w: c.w };
  return null;
}
