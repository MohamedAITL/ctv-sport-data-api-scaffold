import { normalise, searchMatches } from "@/lib/searchMatches";
import { pinFavourites } from "@/components/live/LiveList";
import type { LiveMatch } from "@/types/live";

const match = (id: number, home: string, away: string, competition: string, moroccans?: string[]) => ({
  id, competition, home: { name: home }, away: { name: away },
  moroccans: moroccans?.map((name, i) => ({ id: i, name, photo: null })),
}) as unknown as LiveMatch;

const day = [
  match(1, "الأهلي", "الزمالك", "الدوري المصري"),
  match(2, "الوداد الرياضي", "المغرب التطواني", "البطولة الاحترافية"),
  match(3, "ليل", "لانس", "الدوري الفرنسي", ["أوناحي"]),
  match(4, "Lobos ULMX", "Chapulineros de Oaxaca", "Primera Premier"),
];
const ids = (q: string) => searchMatches(day, q).map((m) => m.id);

describe("normalise", () => {
  it("folds alef forms, ta marbuta, alef maqsura, tashkeel and case", () => {
    expect(normalise("الأهلي")).toBe(normalise("الاهلي"));
    expect(normalise("إبراهيم آية")).toBe("ابراهيم ايه");
    expect(normalise("مُصْطَفَى")).toBe("مصطفي");
    expect(normalise("  Real   MADRID ")).toBe("real madrid");
  });
});

describe("searchMatches", () => {
  it("finds a team whatever the spelling", () => expect(ids("الاهلي")).toEqual([1]));
  it("finds a competition", () => expect(ids("البطوله")).toEqual([2]));
  it("finds a tagged Moroccan", () => expect(ids("اوناحي")).toEqual([3]));
  it("finds Latin names in any case", () => expect(ids("lobos")).toEqual([4]));
  it("needs every word", () => { expect(ids("الوداد التطواني")).toEqual([2]); expect(ids("الوداد ليل")).toEqual([]); });
  it("returns the same list for an empty search", () => { expect(searchMatches(day, "   ")).toBe(day); });
});

describe("pinFavourites", () => {
  const groups = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
  it("moves starred competitions up and keeps both orders", () => {
    expect(pinFavourites(groups, [4, 2]).map((g) => g.id)).toEqual([2, 4, 1, 3]);
  });
  it("leaves the list alone with nothing starred", () => {
    expect(pinFavourites(groups, []).map((g) => g.id)).toEqual([1, 2, 3, 4]);
  });
});
