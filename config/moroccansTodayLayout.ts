// "Moroccans today" poster layout (1080x1350): who played and what they did.
export interface MTText { show: boolean; text?: string; x: number; y: number; fontSize: number; color: string }

export interface MoroccansTodayLayout {
  width: number;
  height: number;
  title: MTText;
  subtitle: MTText;
  footer: MTText;
  rows: {
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
    chipLeftX: number;
    chipFontSize: number;
    chipColor: string;
    chipBg: string;
    chipRadius: number;
  };
}

export const DEFAULT_MOROCCANS_TODAY_LAYOUT: MoroccansTodayLayout = {
  width: 1080,
  height: 1350,
  title: { show: true, text: "", x: 540, y: 96, fontSize: 58, color: "#ffffff" },
  subtitle: { show: true, text: "", x: 540, y: 156, fontSize: 26, color: "#f6c744" },
  footer: { show: true, text: "Choufsport", x: 540, y: 1292, fontSize: 22, color: "#ffffff" },
  rows: {
    firstRowY: 270,
    rowHeight: 150,
    lastRowY: 1200,
    card: { show: true, color: "#3b2a5e", opacity: 0.85, radius: 22, insetX: 48, height: 132 },
    faceX: 950,
    faceSize: 104,
    ringColor: "#c1272d",
    clubSize: 40,
    nameRightX: 875,
    nameDy: -24,
    nameFontSize: 34,
    nameColor: "#ffffff",
    metaDy: 26,
    metaFontSize: 23,
    metaColor: "#f6c744",
    chipLeftX: 76,
    chipFontSize: 23,
    chipColor: "#2a1340",
    chipBg: "#f6c744",
    chipRadius: 10,
  },
};
