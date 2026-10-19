import { generateTitlesOffline } from "@/lib/titlesOffline";

describe("offline title suggestions", () => {
  it("shortens a long headline to a postable length", () => {
    const long = "إنريكي يكشف خطة إيقاف يامال قبل مواجهة برشلونة في دوري أبطال أوروبا ويرفض مقارنته بميسي";
    const out = generateTitlesOffline({ title: long });
    expect(out.length).toBeGreaterThan(0);
    for (const t of out) expect(t.length).toBeLessThanOrEqual(70);
    // cut on a word boundary, not mid-word
    expect(long.startsWith(out[0].slice(0, 20))).toBe(true);
  });

  it("drops the kicker but keeps it as an alternative", () => {
    const out = generateTitlesOffline({ title: "رسميا/ برشلونة يفقد خدمات إريك غارسيا أمام باريس سان جيرمان" });
    expect(out[0].startsWith("رسميا")).toBe(false);
    expect(out.some((t) => t.startsWith("رسميا"))).toBe(true);
  });

  // A mid-sentence cut reads as garbage: "00 غرينيتش)، بخصوص تعليماته…"
  it("rejects fragments that start mid-sentence", () => {
    const body = "يستعد إنريكي لمواجهة فريقه السابق. 00 غرينيتش)، بخصوص تعليماته للمدافعين.";
    const out = generateTitlesOffline({ title: "عنوان صالح للنشر على المواقع", body });
    expect(out.some((t) => /^\d/.test(t))).toBe(false);
    expect(out.some((t) => t.includes("غرينيتش)،"))).toBe(false);
  });

  it("falls back to the opening sentence when there is no usable headline", () => {
    const out = generateTitlesOffline({ title: "", body: "حلت بعثة فريق ستار سبورت بمدينة بركان اليوم الأحد. وأجرت حصة تدريبية." });
    expect(out[0]).toContain("بعثة");
  });

  it("returns nothing rather than junk when there is no text", () => {
    expect(generateTitlesOffline({ title: "", body: "" })).toEqual([]);
  });

  it("never repeats the same suggestion", () => {
    const out = generateTitlesOffline({ title: "نهضة بركان يفوز على الرجاء في مباراة مثيرة", body: "نهضة بركان يفوز على الرجاء في مباراة مثيرة" });
    expect(new Set(out).size).toBe(out.length);
  });
});
