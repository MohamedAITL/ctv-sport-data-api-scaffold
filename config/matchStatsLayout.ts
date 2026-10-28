// Match statistics poster layout (1080x1350). Home of every editable value for
// the poster the live section exports from its الإحصائيات tab.
export interface MatchStatsText { show: boolean; text?: string; x: number; y: number; fontSize: number; color: string }

export interface MatchStatsLayout {
  width: number;
  height: number;
  title: MatchStatsText;
  subtitle: MatchStatsText;
  teams: {
    show: boolean;
    y: number;
    crestSize: number;
    nearX: number; // home, on the right
    farX: number;
    nameDy: number;
    nameFontSize: number;
    nameColor: string;
    scoreFontSize: number;
    scoreColor: string;
    statusDy: number;
    statusFontSize: number;
    statusColor: string;
  };
  firstRowY: number;
  /** Row pitch; a long list shrinks to end above lastRowY. */
  rowHeight: number;
  lastRowY: number;
  rowBg: { show: boolean; color: string; opacity: number; radius: number; insetX: number; height: number };
  label: { dy: number; fontSize: number; color: string };
  value: { nearX: number; farX: number; fontSize: number; color: string; leadColor: string };
  bar: { show: boolean; dy: number; height: number; halfWidth: number; radius: number; homeColor: string; awayColor: string; trackColor: string };
  footer: MatchStatsText;
}

export const DEFAULT_MATCH_STATS_LAYOUT: MatchStatsLayout = {
  width: 1080,
  height: 1350,
  title: { show: true, text: "إحصائيات المباراة", x: 540, y: 96, fontSize: 56, color: "#ffffff" },
  subtitle: { show: true, text: "", x: 540, y: 152, fontSize: 26, color: "#f6c744" },
  teams: {
    show: true, y: 270, crestSize: 120, nearX: 850, farX: 230, nameDy: 96,
    nameFontSize: 28, nameColor: "#ffffff", scoreFontSize: 72, scoreColor: "#ffffff",
    statusDy: 62, statusFontSize: 22, statusColor: "#f6c744",
  },
  firstRowY: 486,
  rowHeight: 124,
  lastRowY: 1230,
  rowBg: { show: true, color: "#3b2a5e", opacity: 0.85, radius: 18, insetX: 56, height: 110 },
  label: { dy: -16, fontSize: 32, color: "#ffffff" },
  value: { nearX: 930, farX: 150, fontSize: 50, color: "#ffffff", leadColor: "#f6c744" },
  bar: { show: true, dy: 28, height: 14, halfWidth: 290, radius: 7, homeColor: "#f6c744", awayColor: "#9b7bd4", trackColor: "#4a3a66" },
  footer: { show: true, text: "Choufsport", x: 540, y: 1292, fontSize: 22, color: "#ffffff" },
};
