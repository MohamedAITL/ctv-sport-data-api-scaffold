// Default poster layout, tuned by eye to the Chouf TV reference poster
// (~/api-image.jpeg, 1080x1350). Every value is editable in DesignSettings and
// resettable to these defaults. Coordinates are in template pixels (top-left
// origin); the export node is exactly width x height.
//
// By default we mask + redraw ONLY the 16 standings rows. The main heading and
// the column headers (نقاط فوز لعب) are static, so they stay as the original
// template pixels unless their overlay is switched on.

export interface TextStyle {
  show: boolean;
  text?: string;
  x: number; // center x for centered text / anchor for aligned text
  y: number;
  fontSize: number;
  color: string;
}

export interface LayoutConfig {
  width: number;
  height: number;

  // Rectangle covering the old rows; redrawn to blend into the panel.
  mask: { x: number; y: number; w: number; h: number; color: string; opacity: number; radius: number };

  // Optional overlays over static template text (off by default).
  heading: TextStyle; // ترتيب البطولة الاحترافية
  columnHeaders: { show: boolean; y: number; fontSize: number; color: string };
  seasonLabel: TextStyle;
  updatedLabel: TextStyle;

  // Row grid.
  table: {
    firstRowCenterY: number;
    rowHeight: number;
    fontSizeName: number;
    fontSizeStat: number;
    fontSizeRank: number;
    nameColor: string;
    logoSize: number;
    // x anchors for each column
    pointsX: number; // center
    winsX: number; // center
    playedX: number; // center
    nameRightX: number; // right edge (name is right-aligned)
    logoCenterX: number;
    rankX: number; // center
  };

  // Zone colouring applied to the rank number and points value.
  zones: {
    topCount: number;
    bottomCount: number;
    topColor: string;
    midColor: string;
    bottomColor: string;
  };
}

export const DEFAULT_LAYOUT: LayoutConfig = {
  width: 1080,
  height: 1350,

  mask: { x: 432, y: 332, w: 618, h: 915, color: "#2b1a45", opacity: 1, radius: 20 },

  heading: {
    show: false,
    text: "ترتيب البطولة الاحترافية",
    x: 745,
    y: 185,
    fontSize: 46,
    color: "#ffffff",
  },
  columnHeaders: { show: false, y: 300, fontSize: 24, color: "#c3b4e6" },
  seasonLabel: { show: false, text: "موسم 2026/2027", x: 745, y: 232, fontSize: 22, color: "#f6c744" },
  updatedLabel: { show: false, text: "", x: 745, y: 1262, fontSize: 18, color: "#c3b4e6" },

  table: {
    firstRowCenterY: 360,
    rowHeight: 56.5,
    fontSizeName: 24,
    fontSizeStat: 27,
    fontSizeRank: 28,
    nameColor: "#ffffff",
    logoSize: 44,
    pointsX: 458,
    winsX: 535,
    playedX: 620,
    nameRightX: 905,
    logoCenterX: 948,
    rankX: 1012,
  },

  zones: {
    topCount: 4,
    bottomCount: 2,
    topColor: "#3ddc84",
    midColor: "#f5c518",
    bottomColor: "#f0564b",
  },
};

// Colour for a given 1-based rank, used for the rank number and points value.
export function zoneColor(rank: number, total: number, z: LayoutConfig["zones"]): string {
  if (rank <= z.topCount) return z.topColor;
  if (rank > total - z.bottomCount) return z.bottomColor;
  return z.midColor;
}
