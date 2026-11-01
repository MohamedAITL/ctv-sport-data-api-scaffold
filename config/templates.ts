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
 * Goal and result posters are centred on the page, where a framed template's
 * rank strip would run under the home crest. So those leagues use a copy with
 * one centred panel. `branded` backgrounds print their own footer. Botola's has
 * its own file because its standings template is a finished poster.
 */
export const MOMENT_BACKGROUNDS: Record<number, { src: string; branded: boolean }> = {
  [BOTOLA_LEAGUE]: { src: "/templates/moment-botola.jpg", branded: true },
  [BOTOLA2_LEAGUE]: { src: "/templates/moment-botola.jpg", branded: true },
  572: { src: "/templates/ucl.jpg", branded: true },
  649: { src: "/templates/saudi.jpg", branded: true },
  11: { src: "/templates/moment-laliga.jpg", branded: false },
  17: { src: "/templates/moment-seriea.jpg", branded: false },
  25: { src: "/templates/moment-bundesliga.jpg", branded: false },
  35: { src: "/templates/moment-ligue1.jpg", branded: false },
};
