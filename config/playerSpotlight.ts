// One player on a poster, built like the goal poster: gold title, big face, big
// name, then the figures as tiles. Moroccan stats and Moroccans Today share it.
export interface PlayerSpotlightLayout {
  titleY: number;
  titleFontSize: number;
  titleColor: string;
  subtitleY: number;
  subtitleFontSize: number;
  subtitleColor: string;
  faceY: number;
  faceSize: number;
  ringWidth: number;
  ringColor: string;
  clubSize: number;
  nameY: number;
  nameFontSize: number;
  nameColor: string;
  chipY: number;
  chipFontSize: number;
  chipColor: string;
  chipBg: string;
  /** The tiles are centred between these two lines. */
  statsTop: number;
  statsBottom: number;
  statsInsetX: number;
  tileGap: number;
  tileMaxHeight: number;
  tileRadius: number;
  tileColor: string;
  tileOpacity: number;
  valueFontSize: number;
  valueColor: string;
  labelFontSize: number;
  labelColor: string;
  noteFontSize: number;
  noteColor: string;
}

export const DEFAULT_PLAYER_SPOTLIGHT: PlayerSpotlightLayout = {
  titleY: 92,
  titleFontSize: 76,
  titleColor: "#f6c744",
  subtitleY: 164,
  subtitleFontSize: 30,
  subtitleColor: "#ffffff",
  faceY: 424,
  faceSize: 410,
  ringWidth: 12,
  ringColor: "#f6c744",
  clubSize: 118,
  nameY: 686,
  nameFontSize: 72,
  nameColor: "#ffffff",
  chipY: 790,
  chipFontSize: 30,
  chipColor: "#2a1340",
  chipBg: "#f6c744",
  statsTop: 838,
  statsBottom: 1250,
  statsInsetX: 60,
  tileGap: 18,
  tileMaxHeight: 300,
  tileRadius: 20,
  tileColor: "#000000",
  tileOpacity: 0.32,
  valueFontSize: 120,
  valueColor: "#f6c744",
  labelFontSize: 34,
  labelColor: "#ffffff",
  noteFontSize: 25,
  noteColor: "#e9e2f2",
};
