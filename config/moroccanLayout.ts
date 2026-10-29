// Moroccan players poster layout (1080x1350): a roundup of several highlights,
// or one player's spotlight when a single highlight is picked.
export interface MLText { show: boolean; text?: string; x: number; y: number; fontSize: number; color: string }

export interface MoroccanLayout {
  width: number;
  height: number;
  title: MLText;
  subtitle: MLText;
  footer: MLText;
  roundup: {
    firstRowY: number;
    /** Row pitch; a long list shrinks to end above lastRowY. */
    rowHeight: number;
    lastRowY: number;
    card: { show: boolean; color: string; opacity: number; radius: number; insetX: number; height: number };
    faceX: number;
    faceSize: number;
    ringColor: string;
    clubSize: number;
    nameRightX: number;
    nameDy: number;
    nameFontSize: number;
    nameColor: string;
    metaDy: number;
    metaFontSize: number;
    metaColor: string;
    compLogoSize: number;
    valueX: number;
    valueFontSize: number;
    valueColor: string;
    rankX: number;
    rankSize: number;
    rankFontSize: number;
    rankBg: string;
    rankColor: string;
  };
  spotlight: {
    faceY: number;
    faceSize: number;
    ringWidth: number;
    ringColor: string;
    clubSize: number;
    nameY: number;
    nameFontSize: number;
    nameColor: string;
    compY: number;
    compLogoSize: number;
    compFontSize: number;
    compColor: string;
    valueY: number;
    valueFontSize: number;
    valueColor: string;
    categoryY: number;
    categoryFontSize: number;
    categoryColor: string;
    rankY: number;
    rankFontSize: number;
    rankColor: string;
  };
}

export const DEFAULT_MOROCCAN_LAYOUT: MoroccanLayout = {
  width: 1080,
  height: 1350,
  title: { show: true, text: "المغاربة في الصدارة", x: 540, y: 96, fontSize: 58, color: "#ffffff" },
  subtitle: { show: true, text: "", x: 540, y: 156, fontSize: 26, color: "#f6c744" },
  footer: { show: true, text: "Choufsport", x: 540, y: 1292, fontSize: 22, color: "#ffffff" },
  roundup: {
    firstRowY: 270,
    rowHeight: 150,
    lastRowY: 1200,
    card: { show: true, color: "#3b2a5e", opacity: 0.85, radius: 22, insetX: 48, height: 132 },
    faceX: 950,
    faceSize: 104,
    ringColor: "#c1272d",
    clubSize: 40,
    nameRightX: 875,
    nameDy: -22,
    nameFontSize: 34,
    nameColor: "#ffffff",
    metaDy: 26,
    metaFontSize: 22,
    metaColor: "#f6c744",
    compLogoSize: 30,
    valueX: 250,
    valueFontSize: 60,
    valueColor: "#ffffff",
    rankX: 120,
    rankSize: 70,
    rankFontSize: 30,
    rankBg: "#c1272d",
    rankColor: "#ffffff",
  },
  spotlight: {
    faceY: 470,
    faceSize: 400,
    ringWidth: 10,
    ringColor: "#c1272d",
    clubSize: 110,
    nameY: 735,
    nameFontSize: 60,
    nameColor: "#ffffff",
    compY: 815,
    compLogoSize: 48,
    compFontSize: 30,
    compColor: "#f6c744",
    valueY: 960,
    valueFontSize: 150,
    valueColor: "#ffffff",
    categoryY: 1075,
    categoryFontSize: 40,
    categoryColor: "#ffffff",
    rankY: 1150,
    rankFontSize: 32,
    rankColor: "#f6c744",
  },
};
