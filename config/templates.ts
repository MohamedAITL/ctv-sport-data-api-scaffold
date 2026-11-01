import { BOTOLA2_LEAGUE, BOTOLA_LEAGUE } from "./standingsLeagues";

export const BOTOLA_TEMPLATE = "/templates/botola.jpg";

// The big competitions ship with a bundled template; the others start on a
// plain background until the user uploads their own.
export const BUNDLED_TEMPLATES: Record<number, string> = {
  [BOTOLA_LEAGUE]: BOTOLA_TEMPLATE,
  572: "/templates/ucl.jpg",
  11: "/templates/laliga.jpg",
  17: "/templates/seriea.jpg",
  25: "/templates/bundesliga.jpg",
  35: "/templates/ligue1.jpg",
  649: "/templates/saudi.jpg",
};

/**
 * Every poster of one competition uses its background, except the standings
 * above. They are centred on the page, where a framed template's rank strip
 * would run under the home crest, so those leagues use a copy with one centred panel. `branded`
 * backgrounds print their own footer. Botola's has its own file because its
 * standings template is a finished poster, and Saudi's sits its logo higher,
 * clear of the team line on the lineup poster.
 */
export const COMPETITION_BACKGROUNDS: Record<number, { src: string; branded: boolean }> = {
  [BOTOLA_LEAGUE]: { src: "/templates/moment-botola.jpg", branded: true },
  [BOTOLA2_LEAGUE]: { src: "/templates/moment-botola.jpg", branded: true },
  572: { src: "/templates/ucl.jpg", branded: true },
  649: { src: "/templates/moment-saudi.jpg", branded: true },
  11: { src: "/templates/moment-laliga.jpg", branded: false },
  17: { src: "/templates/moment-seriea.jpg", branded: false },
  25: { src: "/templates/moment-bundesliga.jpg", branded: false },
  35: { src: "/templates/moment-ligue1.jpg", branded: false },
};

/** The competition a list of posters' items shares, or null when it mixes several. */
export function sharedCompetition(ids: Array<number | null | undefined>): number | null {
  const first = ids[0] ?? null;
  return first !== null && ids.every((id) => id === first) ? first : null;
}

/** An uploaded template wins; otherwise the competition's own background. */
export const backgroundFor = (uploaded: string | null, competitionId: number | null): string | null =>
  uploaded ?? (competitionId === null ? null : COMPETITION_BACKGROUNDS[competitionId]?.src ?? null);

/** A background that prints its own footer replaces the poster's; an upload does not. */
export function withBackgroundFooter<T extends { footer: { show: boolean } }>(layout: T, competitionId: number | null, template: string | null): T {
  const background = competitionId === null ? undefined : COMPETITION_BACKGROUNDS[competitionId];
  return background?.branded && template === background.src ? { ...layout, footer: { ...layout.footer, show: false } } : layout;
}
