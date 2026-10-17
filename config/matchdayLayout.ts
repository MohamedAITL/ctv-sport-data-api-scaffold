// Default matchday poster layout (1080x1350). Tuned by eye; every value is
// editable in the UI. Rows: home team on the right (RTL), away on the left,
// time/score + small league logo in the centre. When a template is loaded, turn
// the title/date overlays off (the template supplies them).
export interface MLText { show: boolean; text?: string; x: number; y: number; fontSize: number; color: string }

export interface MatchdayLayout {
  width: number;
  height: number;
  title: MLText;
  dateLabel: MLText;
  firstRowCenterY: number;
  rowHeight: number;
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
  leagueLogo: { show: boolean; size: number; dy: number };
}

export const DEFAULT_MATCHDAY_LAYOUT: MatchdayLayout = {
  width: 1080,
  height: 1350,
  title: { show: false, text: "أبرز مباريات اليوم", x: 540, y: 95, fontSize: 54, color: "#ffffff" },
  dateLabel: { show: true, text: "", x: 540, y: 158, fontSize: 26, color: "#f6c744" },
  firstRowCenterY: 258,
  rowHeight: 104,
  rowBg: { show: true, color: "#3b2a5e", opacity: 0.85, radius: 16, insetX: 40, height: 88 },
  badgeSize: 58,
  nameFontSize: 27,
  nameColor: "#ffffff",
  nameMaxWidth: 300,
  centerX: 540,
  centerFontSize: 46,
  centerColor: "#ffffff",
  homeBadgeX: 1002,
  homeNameRightX: 930,
  awayBadgeX: 78,
  awayNameLeftX: 150,
  leagueLogo: { show: true, size: 30, dy: -30 },
};
