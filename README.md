# Botola Pro — Standings Poster Generator (Chouf TV)

Local app that regenerates the Chouf TV 1080×1350 Botola Pro standings poster
from **live GOAL API data**, overwriting only the standings region of the
original design and exporting a publication-ready PNG.

Stack: **Next.js 14 + TypeScript + Tailwind**. The GOAL API key stays server-side
in a Next API route and is never shipped to the browser.

## Verified (2026-10-17, against the live GOAL API)

- Discovery resolves **Morocco Botola Pro**, season **2026/2027**, 16 clubs.
- Field mapping uses the documented response fields
  (`overallLeaguePosition`, `team.name`, `overallLeaguePlayed`,
  `overallLeagueW`, `overallLeaguePTS`, logo = `team.badge`) — values match the
  reference poster.
- Export produces a real **1080×1350 PNG**; Arabic renders correctly; the old
  standings are fully covered; player / Chouf TV logo / heading / footer intact.
- 18 unit tests pass (`npm test`). Bad-key path returns HTTP 401 → app serves the
  cached table flagged **stale** (never a silent/misleading poster).

## Setup

```bash
npm install
cp .env.example .env.local      # then put your key in .env.local
npm run dev                     # http://localhost:3000
```

Get a free GOAL API key at https://goal-api.com/signup (free tier, no card) and
set it in `.env.local`:

```
GOAL_API_KEY=your_api_key_here
GOAL_API_BASE=https://api.goal-api.com/v1
```

`.env.local` is gitignored — the key is read only in `pages/api/*`.

## Workflow

1. **Refresh standings** — pulls the current table (status + timestamp + club
   count shown; falls back to cached data, marked stale, if the API fails).
2. **Teams** — edit any club's Arabic name or upload a logo override; edits are
   saved locally and survive a refresh. API stats are read-only.
3. **Template** — use the bundled reference poster or upload your own
   (PNG/JPG); reset anytime.
4. **Design** — adjust row positions, fonts, logo size, column X positions, the
   mask that covers the old rows, zone colors, and optional overlays.
5. **Download PNG / JPEG** — exports exactly 1080×1350 as
   `botola-pro-standings-YYYY-MM-DD.png`. The preview is the export node, so what
   you see is what you get. **Reset design** restores layout defaults but keeps
   your name/logo edits.

## How it works

- `lib/goalApi.ts` — keyed Bearer fetch, maps 401/403/429/network/non-JSON to
  typed errors.
- `lib/discovery.ts` — resolves the league via `/countries → Morocco → leagues`
  (verifies the id hint first); persists `{leagueId, season}` to
  `data/settings.json`. No hardcoded old season id.
- `lib/normalize.ts` — documented fields first (aliases only as fallback),
  string stats parsed to numbers, missing fields surfaced as warnings (never
  invented), sorted by official position.
- `pages/api/standings.ts` — fetch → normalize → **inline each logo as a data
  URL server-side** (defeats canvas CORS) → validate → cache. On failure serves
  the last-good cache with `stale: true`.
- `components/Poster.tsx` — the fixed 1080×1350 export node: base template image,
  an opaque mask over the old rows, then the RTL standings overlaid. Captured
  client-side by `html-to-image` after fonts + images are ready.
- Arabic font **Cairo** is self-hosted (`@fontsource/cairo`) for reliable
  embedding in the export.
- Persistence: small settings (layout, Arabic names) in `localStorage`; large
  assets (logo/template overrides) in **IndexedDB**; league/season + last-good
  standings server-side in `data/settings.json`.

## Data notes

- **Season selector:** the live API exposes a single current season
  (`league.season` = 2026/2027, `isActive`). It isn't a documented per-request
  parameter, so there is no season dropdown — the app shows the current table
  labelled with the real season from the response. Add a selector only if the API
  later supports historical seasons.
- **Zone colors** default to top-4 green / bottom-2 red / mid gold (configurable).
  The API also returns `overallPromotion` (CAF / relegation) if you prefer
  semantic zones.
- `data/botolaTeams.json` seeds Arabic names keyed by stable `teamId`; your
  in-app edits override it and persist.

## Tests

```bash
npm test          # jest: normalize, discovery, validate, layout, persistence, Poster render
npm run typecheck # tsc --noEmit
```

Tests use a clearly-labelled mock fixture shaped like the real response — never
presented as live data.

## Matchday poster (`/matchday`)

A second poster that lists up to **10 matches** for a chosen date: **all Botola
Pro matches first**, then the **most famous matches** from the big competitions
(UCL, Europa, Premier League, La Liga, Serie A, Bundesliga, Ligue 1) ranked by a
curated club-fame weighting.

- `config/featuredLeagues.ts` — the scanned competitions (IDs verified live) +
  `MAX_MATCHES = 10`.
- `config/famousClubs.ts` — club fame weights + Arabic names (drives "most
  famous" ranking and auto-Arabic for big clubs).
- `pages/api/fixtures.ts` — fetches each league's fixtures for the date
  (`?from=D&to=D`, the only working date filter), selects (Botola first, then
  fame), inlines logos, caches to `data/matchday.json`, stale-fallback on failure.
- `components/MatchdayPoster.tsx` — home (right) vs away (left), kickoff/score +
  league logo in the centre. Upload your own template and switch the title/date/
  row-card overlays off in Design. Team Arabic names/badges are editable and
  shared with the standings editor (same teamId). Export is 1080×1350
  (`choufsport-matchday-YYYY-MM-DD.png`).

Switch between the two posters with the **Standings / Matchday** nav.

Notes: kickoff times are the API's `matchTime` (venue-local). "Most famous" is
ranked globally by club fame; non-listed clubs show their English name until you
add an Arabic override.
