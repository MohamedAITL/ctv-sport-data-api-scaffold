# Chouf TV — Sports Poster Studio

Local app that builds Chouf TV's 1080×1350 sports posters from **live 365scores
data** (native Arabic club and player names) and exports publication-ready PNGs.

Four posters, one per page:

| Page | Poster | Leagues |
| --- | --- | --- |
| `/` | **Standings** table | Botola Pro, **Botola 2**, La Liga, Premier League, Champions League |
| `/round` | **Matches of a round** (الجولة) — fixtures or results | Botola Pro, Botola 2 |
| `/matchday` | Best matches of a given day, and their results | multi-league (GOAL API) |
| `/stats` | **Leaderboards** — Arabic player & team stat categories | every competition that publishes them |
| `/news` | **News hub** — aggregated Arabic sports news, with a page per article | — |
| `/live` | **Live match centre** for an interactive touchscreen — scores, lineups on a pitch, stats, events | every live football match |

Standings adapt to table size: 16-team Botola keeps the bundled template's panel
layout, 20-team leagues use the full canvas at full row size, and the 36-team
Champions League league phase is split into **two readable columns** instead of
being shrunk to fit. Each league keeps its own template and layout.

A round with no published schedule is reported as such — 365scores publishes
fixtures only once a round is announced, and games scheduled before a round is
assigned appear under **مباريات قادمة**. The poster is never exported empty.

**Competitions**: ~24 football competitions grouped by region (Morocco, Africa,
Europe, International). Availability is seasonal — a knockout cup has no league
table until a group stage runs, and some competitions publish no stats — so every
page asks the API and says plainly when there is nothing to show, rather than
rendering an empty poster.

**News** is aggregated from **kooora.com** (30 items/page), **hesport.com**
(RSS), **elbotola.com** (public JSON feed) and **365scores**. A refresh button
re-reads the publishers and reports how many stories are new, keeping what is
already on screen; "المزيد" pages deeper into the paginated sources. Each article has its own page; the body is shown only
where the publisher syndicates it (hesport's feed, kooora's and elbotola's own
page data), 365scores gets a summary, and every page credits the source and links to the original.
A button suggests short Arabic headlines for social posts — cut from the
article's own wording by default, or written by Claude if `ANTHROPIC_API_KEY`
is set.

**Live** (`/live`) is a full-screen kiosk for a wall-mounted touchscreen: no app
nav, a match rail beside the selected match, and everything 365scores exposes —
score and clock, the lineup drawn on a pitch from the source's own coordinates,
both teams' statistics, the event timeline, referee, venue and TV channels. It
refreshes itself every 15s without disturbing the selection, tab or scroll
position, and pauses while the tab is hidden. Not every competition publishes a
lineup, so the pitch degrades to a plain XI list and then to a clear message.

Stack: **Next.js 14 + TypeScript + Tailwind**. 365scores needs no key; the GOAL
API key (Botola standings fallback + the matchday page) stays server-side in a
Next API route, never shipped to the browser.

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

## Deploy to Netlify

1. Push this repo to GitHub (done).
2. In Netlify: **Add new site → Import from Git**, pick the repo. Build command
   `npm run build` and the Next.js runtime are auto-detected (`netlify.toml`).
3. **Site settings → Environment variables**, add:
   - `GOAL_API_KEY` = your key (kept server-side in the API functions; never exposed)
   - `GOAL_API_BASE` = `https://api.goal-api.com/v1`
4. Deploy. The API routes run as serverless functions; the poster pages are
   static/client-rendered.

Note: the on-disk cache (`data/settings.json`, `data/matchday.json`) is not used
on Netlify's read-only filesystem — the league is re-resolved via the id hint and
data is fetched fresh each request (team names/logos still come from the bundled
`data/botolaTeams.json` and your browser overrides).

### Fixtures vs Results

The matchday page has a **Fixtures / Results** switch (remembered per browser):

- **Fixtures · المباريات** — kickoff times. Title overlay is off by default.
- **Results · النتائج** — final scores, titled `نتائج مباريات اليوم`. The score
  sits next to its own team (home is on the right, so the centre reads
  `away - home` left-to-right). A penalty shootout adds `(away - home)` under the
  score, and a live match shows its minute. Matches that have not finished keep
  their kickoff time, dimmed, so a half-played day is never mistaken for results.
  Export is blocked while nothing has finished yet.

Both read the same `/api/fixtures` response — switching modes costs no API call.
Exported files are named after the selected date
(`choufsport-results-YYYY-MM-DD.png`).
