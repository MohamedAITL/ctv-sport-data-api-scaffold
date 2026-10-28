import { moroccanTier } from "@/lib/scores365Games";

const club = (countryId: number) => ({ countryId, type: 1 });
const national = (countryId: number) => ({ countryId, type: 2 });
const game = (competitionId: number, home: object, away: object) => ({ competitionId, homeCompetitor: home, awayCompetitor: away });

// Shapes as 365scores sent them on 25-28 Oct: Morocco is country 127; a
// Moroccan club abroad is tagged on the club, not on the competition.
it("ranks Moroccan football: national team, Botola, clubs abroad, Throne Cup, Botola 2, the rest", () => {
  const u17Women = moroccanTier(game(9999, national(150), national(127)), 0); // a World Cup, not Moroccan
  const botola = moroccanTier(game(557, club(127), club(127)), 127);
  const casInCaf = moroccanTier(game(624, club(30), club(127)), 0); // ASEC v MAS, CAF Champions League
  const throne = moroccanTier(game(5420, club(127), club(127)), 127);
  const botola2 = moroccanTier(game(5651, club(127), club(127)), 127);
  const womenLeague = moroccanTier(game(7777, club(127), club(127)), 127);
  expect([u17Women, botola, casInCaf, throne, botola2, womenLeague]).toEqual([6, 5, 4, 3, 2, 1]);
});

it("leaves out matches with nothing Moroccan in them", () => {
  expect(moroccanTier(game(7, club(1), club(1)), 1)).toBe(0); // Premier League
  expect(moroccanTier(game(9999, national(150), national(30)), 0)).toBe(0); // another country's national team
});
