// Head-to-head poster layout (1080x1350). Home of every editable value for the
// poster the live section exports from its مواجهات سابقة tab.
export interface H2HText { show: boolean; text?: string; x: number; y: number; fontSize: number; color: string }

export interface H2HLayout {
  width: number;
  height: number;
  rows: number; // meetings shown (the feature is "last 5", but it is a value)
  /** Only the meetings played in the competition this match belongs to. */
  sameCompetitionOnly: boolean;
  title: H2HText;
  subtitle: H2HText;
  teams: {
    show: boolean;
    y: number;
    crestSize: number;
    nearX: number; // the match's own side
    farX: number;
    nameDy: number;
    nameFontSize: number;
    nameColor: string;
    vsFontSize: number;
    vsColor: string;
  };
  record: {
    show: boolean;
    y: number;
    fontSize: number;
    color: string;
    drawColor: string;
    /** The word under the draws figure; the two wins have team names above. */
    drawLabel: { show: boolean; text?: string; dy: number; fontSize: number; color: string };
    metaDy: number;
    metaFontSize: number;
    metaColor: string;
  };
  firstRowY: number;
  rowHeight: number;
  rowBg: { show: boolean; color: string; opacity: number; radius: number; insetX: number; height: number };
  rowDate: { show: boolean; dy: number; fontSize: number; color: string };
  rowNameRight: number;
  rowNameLeft: number;
  rowNameWidth: number;
  rowNameFontSize: number;
  rowNameColor: string;
  rowCrestNear: number;
  rowCrestFar: number;
  rowCrestSize: number;
  rowScoreFontSize: number;
  rowScoreColor: string;
  footer: H2HText;
}

export const DEFAULT_H2H_LAYOUT: H2HLayout = {
  width: 1080,
  height: 1350,
  rows: 5,
  sameCompetitionOnly: true,
  title: { show: true, text: "المواجهات المباشرة", x: 540, y: 108, fontSize: 58, color: "#ffffff" },
  subtitle: { show: true, text: "", x: 540, y: 168, fontSize: 28, color: "#f6c744" },
  teams: {
    show: true, y: 300, crestSize: 132, nearX: 830, farX: 250, nameDy: 108,
    nameFontSize: 30, nameColor: "#ffffff", vsFontSize: 40, vsColor: "#ffffff",
  },
  record: {
    show: true, y: 470, fontSize: 64, color: "#ffffff", drawColor: "#f6c744",
    drawLabel: { show: true, text: "تعادل", dy: -46, fontSize: 24, color: "#f6c744" },
    metaDy: 52, metaFontSize: 24, metaColor: "#ffffff",
  },
  firstRowY: 620,
  rowHeight: 128,
  rowBg: { show: true, color: "#3b2a5e", opacity: 0.85, radius: 20, insetX: 56, height: 108 },
  rowDate: { show: true, dy: -30, fontSize: 20, color: "#ffffff" },
  rowNameRight: 1000,
  rowNameLeft: 80,
  rowNameWidth: 232,
  rowNameFontSize: 26,
  rowNameColor: "#ffffff",
  rowCrestNear: 720,
  rowCrestFar: 360,
  rowCrestSize: 54,
  rowScoreFontSize: 38,
  rowScoreColor: "#ffffff",
  footer: { show: true, text: "Choufsport", x: 540, y: 1292, fontSize: 22, color: "#ffffff" },
};
