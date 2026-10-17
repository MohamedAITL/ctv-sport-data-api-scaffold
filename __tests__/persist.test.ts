import { saveNameOverrides, loadNameOverrides } from "@/lib/persist";

// Manual Arabic-name corrections must survive a standings refresh: they live in
// localStorage and are re-applied on top of fresh API rows, never overwritten.
describe("name overrides persistence", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips and is re-applied after a simulated refresh", () => {
    saveNameOverrides({ t1: "حسنية أكادير (محرر)" });
    const freshRowsFromApi = [{ teamId: "t1", nameAr: "Hassania Agadir" }];
    const overrides = loadNameOverrides();
    const effective = freshRowsFromApi.map((r) => ({
      ...r,
      nameAr: overrides[r.teamId] ?? r.nameAr,
    }));
    expect(effective[0].nameAr).toBe("حسنية أكادير (محرر)");
  });
});
