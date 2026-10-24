import { estimatePositions } from "@/lib/live365";

const m = (pos: string, role?: string) => ({ position: { shortName: pos }, formation: role ? { shortName: role } : undefined });

// المغرب التطواني's sheet as 365scores published it an hour before kickoff:
// roles, but no field positions and no formation.
const TETOUAN = [
  m("Defender", "Right Back"), m("Defender", "Left Back"), m("Midfielder", "Central Midfield"),
  m("Midfielder"), m("Attacker", "Left Forward"), m("Midfielder", "Attacking Midfield"),
  m("Midfielder", "Attacking Midfield"), m("Goalkeeper", "Goalkeeper"), m("Midfielder", "Central Midfield"),
  m("Defender", "Centre Back"), m("Attacker", "Right Forward"),
];

it("places a fresh lineup from its roles, keeper to attack, and names the formation", () => {
  const { spots, formation } = estimatePositions(TETOUAN);
  expect(formation).toBe("3-3-2-2");
  expect(spots[7]).toEqual({ line: 0, side: 50 }); // the keeper
  // the back line, left to right from the team's own point of view
  expect([spots[1].side, spots[9].side, spots[0].side]).toEqual([20, 50, 80]);
  const back = spots[0].line;
  expect([spots[1].line, spots[9].line]).toEqual([back, back]);
  // attacking midfielders sit between midfield and the forwards
  expect(spots[5].line).toBeGreaterThan(spots[2].line);
  expect(spots[4].line).toBeGreaterThan(spots[5].line);
  // the left forward is on the left, the right forward on the right
  expect(spots[4].side).toBeLessThan(spots[10].side);
  expect(spots[4].line).toBe(99);
});

it("falls back on the broad position when the role is missing or unknown", () => {
  const { formation } = estimatePositions([
    m("Goalkeeper"), m("Defender"), m("Defender", "Libero"), m("Midfielder"), m("Attacker", "Second Striker"),
  ]);
  expect(formation).toBe("2-1-1");
});
