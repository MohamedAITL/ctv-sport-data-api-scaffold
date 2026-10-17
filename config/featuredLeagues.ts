// Competitions scanned for the matchday poster. Botola Pro is the priority
// (ALL its matches on the day are included first); the rest supply the most
// famous matches to fill up to the cap. IDs verified live against the GOAL API
// (2026/2027). Season-independent — the fixtures endpoint returns current data.
export const BOTOLA_LEAGUE_ID = "cmr77dw7800g9rx06v6a4zya0";
export const MAX_MATCHES = 10;

export interface FeaturedLeague {
  id: string;
  name: string;
  popularity: number; // from the API; used to break fame ties
}

// Order is only cosmetic; selection uses popularity + club fame.
export const FEATURED_LEAGUES: FeaturedLeague[] = [
  { id: BOTOLA_LEAGUE_ID, name: "Botola Pro", popularity: 20 },
  { id: "cmr77dw3900f5rx06j05wgzv4", name: "UEFA Champions League", popularity: 100 },
  { id: "cmr77dw3900f6rx06tuqwft2d", name: "UEFA Europa League", popularity: 100 },
  { id: "cmr77dvkr005nrx06lp7rvp49", name: "Premier League", popularity: 95 },
  { id: "cmr77dvnt006nrx063v3w622e", name: "La Liga", popularity: 95 },
  { id: "cmr77dvpd006yrx06zig7907g", name: "Serie A", popularity: 95 },
  { id: "cmr77dvgm0002rx06rt2uqxii", name: "Bundesliga", popularity: 95 },
  { id: "cmr77dvqg007crx06q1kaceyo", name: "Ligue 1", popularity: 95 },
];
