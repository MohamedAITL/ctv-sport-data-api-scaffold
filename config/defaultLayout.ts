// Default poster layout, tuned by eye to the Chouf TV reference poster
// (~/api-image.jpeg, 1080x1350). Every value is editable in DesignSettings and
// resettable to these defaults. Coordinates are in template pixels (top-left
// origin); the export node is exactly width x height.
//
// By default we mask + redraw ONLY the 16 standings rows. The main heading and
// the column headers (نقاط فوز لعب) are static, so they stay as the original
// template pixels unless their overlay is switched on.

import { MOROCCAN_LEAGUES } from "@/config/standingsLeagues";

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
  mask: { x: number; y: number; w: number; h: number; color: string; opacity: number; radius: number; show: boolean };

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
    // Horizontal extent a row occupies; used to remap anchors into side-by-side
    // columns so a big table stays readable instead of shrinking to fit.
    spanLeft: number;
    spanRight: number;
    columns: 1 | 2 | "auto"; // "auto" -> 2 columns past `twoColFrom` rows
    twoColFrom: number;
    columnGap: number;
    twoColScale: number; // type/logo scale inside a half-width column
    minFontSize: number; // auto-fit never shrinks the name below this
    bottomY: number; // last row must stay above this
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

  mask: { x: 432, y: 332, w: 618, h: 915, color: "#2b1a45", opacity: 1, radius: 20, show: false },

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
    spanLeft: 432,
    spanRight: 1050,
    columns: "auto",
    twoColFrom: 23,
    columnGap: 40,
    twoColScale: 0.82,
    minFontSize: 15,
    bottomY: 1230,
  },

  zones: {
    topCount: 4,
    bottomCount: 2,
    topColor: "#3ddc84",
    midColor: "#f5c518",
    bottomColor: "#f0564b",
  },
};

// Layout for leagues with no bundled Chouf TV template: the rows get the whole
// canvas instead of the narrow right-hand panel the Botola poster reserves for
// the player cutout. That alone keeps a 20-team table at full row size, and the
// heading/column headers are drawn because no template supplies them.
export const FULL_CANVAS_LAYOUT: LayoutConfig = {
  ...DEFAULT_LAYOUT,
  mask: { ...DEFAULT_LAYOUT.mask, show: false },
  heading: { show: true, text: "", x: 540, y: 86, fontSize: 52, color: "#ffffff" },
  columnHeaders: { show: true, y: 168, fontSize: 24, color: "#c3b4e6" },
  seasonLabel: { ...DEFAULT_LAYOUT.seasonLabel, show: false, x: 540, y: 132 },
  updatedLabel: { ...DEFAULT_LAYOUT.updatedLabel, x: 540 },
  table: {
    ...DEFAULT_LAYOUT.table,
    firstRowCenterY: 225,
    rowHeight: 57,
    pointsX: 110,
    winsX: 200,
    playedX: 300,
    nameRightX: 910,
    logoCenterX: 960,
    rankX: 1030,
    spanLeft: 40,
    spanRight: 1050,
    bottomY: 1285,
  },
};

export function defaultLayoutFor(leagueId: number): LayoutConfig {
  return MOROCCAN_LEAGUES.includes(leagueId) ? DEFAULT_LAYOUT : FULL_CANVAS_LAYOUT;
}

// Colour for a given 1-based rank, used for the rank number and points value.
export function zoneColor(rank: number, total: number, z: LayoutConfig["zones"]): string {
  if (rank <= z.topCount) return z.topColor;
  if (rank > total - z.bottomCount) return z.bottomColor;
  return z.midColor;
}
