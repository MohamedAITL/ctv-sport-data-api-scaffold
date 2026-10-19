// Default stats leaderboard layout (1080x1350). Home of every editable value for
// the stats poster; `topN` is how many entries the poster shows.
export interface SLText { show: boolean; x: number; y: number; fontSize: number; color: string }

export interface StatsLayout {
  width: number;
  height: number;
  title: SLText;
  subtitle: SLText;
  topN: number;
  firstRowCenterY: number;
  rowHeight: number;
  bottomY: number;
  rowBg: { show: boolean; color: string; opacity: number; radius: number; insetX: number; height: number };
  photoSize: number;
  photoX: number;
  clubX: number;
  rankX: number;
  rankColor: string;
  nameRightX: number;
  nameMaxWidth: number;
  nameFontSize: number;
  nameColor: string;
  showSecondary: boolean;
  secondaryFontSize: number;
  secondaryColor: string;
  valueX: number;
  valueFontSize: number;
  valueColor: string;
  rankFontSize: number;
  topColor: string; // highlight for the top three
  minFontSize: number;
}

export const DEFAULT_STATS_LAYOUT: StatsLayout = {
  width: 1080,
  height: 1350,
  title: { show: true, x: 540, y: 110, fontSize: 58, color: "#ffffff" },
  subtitle: { show: true, x: 540, y: 172, fontSize: 28, color: "#f6c744" },
  topN: 10,
  firstRowCenterY: 290,
  rowHeight: 100,
  bottomY: 1280,
  rowBg: { show: true, color: "#3b2a5e", opacity: 0.85, radius: 18, insetX: 50, height: 88 },
  photoSize: 72,
  photoX: 918,
  clubX: 958,
  rankX: 1010,
  rankColor: "#c3b4e6",
  nameRightX: 850,
  nameMaxWidth: 520,
  nameFontSize: 34,
  nameColor: "#ffffff",
  showSecondary: true,
  secondaryFontSize: 20,
  secondaryColor: "#c3b4e6",
  valueX: 140,
  valueFontSize: 46,
  valueColor: "#ffffff",
  rankFontSize: 30,
  topColor: "#f6c744",
  minFontSize: 18,
};
