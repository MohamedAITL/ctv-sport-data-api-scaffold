// Default matchday poster layout (1080x1350). Matches are grouped by competition
// (Botola first, then by fame/popularity); each group has a header. Every value
// is editable in the UI. Home team is on the right (RTL), away on the left.
export interface MLText { show: boolean; text?: string; x: number; y: number; fontSize: number; color: string }

export interface MatchdayLayout {
  width: number;
  height: number;
  title: MLText;
  resultsTitle: MLText; // shown instead of `title` in Results mode
  dateLabel: MLText;
  firstRowCenterY: number; // y of the first element (group header or row)
  rowHeight: number;
  groupHeader: { show: boolean; height: number; fontSize: number; color: string; logoSize: number; dy: number };
  groupGap: number;
  rowBg: { show: boolean; color: string; opacity: number; radius: number; insetX: number; height: number };
  badgeSize: number;
  nameFontSize: number;
  nameColor: string;
  nameMaxWidth: number;
  centerX: number;
  centerFontSize: number;
  centerColor: string;
  homeBadgeX: number;
  homeNameRightX: number;
  awayBadgeX: number;
  awayNameLeftX: number;
}

export const DEFAULT_MATCHDAY_LAYOUT: MatchdayLayout = {
  width: 1080,
  height: 1350,
  title: { show: false, text: "أبرز مباريات اليوم", x: 540, y: 95, fontSize: 54, color: "#ffffff" },
  resultsTitle: { show: true, text: "نتائج مباريات اليوم", x: 540, y: 92, fontSize: 54, color: "#ffffff" },
  dateLabel: { show: true, text: "", x: 540, y: 150, fontSize: 28, color: "#f6c744" },
  firstRowCenterY: 205,
  rowHeight: 78,
  groupHeader: { show: true, height: 62, fontSize: 32, color: "#f6c744", logoSize: 40, dy: 0 },
  groupGap: 8,
  rowBg: { show: true, color: "#3b2a5e", opacity: 0.85, radius: 16, insetX: 40, height: 70 },
  badgeSize: 50,
  nameFontSize: 27,
  nameColor: "#ffffff",
  nameMaxWidth: 300,
  centerX: 540,
  centerFontSize: 42,
  centerColor: "#ffffff",
  homeBadgeX: 1002,
  homeNameRightX: 930,
  awayBadgeX: 78,
  awayNameLeftX: 150,
};
