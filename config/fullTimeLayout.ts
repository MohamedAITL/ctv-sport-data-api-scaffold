// Full-time poster layout (1080x1350): the score and everyone who scored.
export interface FullTimeText { show: boolean; text?: string; x: number; y: number; fontSize: number; color: string }

export interface FullTimeLayout {
  width: number;
  height: number;
  title: FullTimeText;
  subtitle: FullTimeText;
  teams: {
    y: number;
    crestSize: number;
    nearX: number; // home, on the right
    farX: number;
    nameDy: number;
    nameFontSize: number;
    nameColor: string;
    scoreFontSize: number;
    scoreColor: string;
    shootoutDy: number;
    shootoutFontSize: number;
    shootoutColor: string;
  };
  scorers: {
    show: boolean;
    firstRowY: number;
    /** Row pitch; a long list shrinks to end above lastRowY. */
    rowHeight: number;
    lastRowY: number;
    nearX: number;
    farX: number;
    columnWidth: number;
    fontSize: number;
    color: string;
    minuteColor: string;
  };
  footer: FullTimeText;
}

export const DEFAULT_FULL_TIME_LAYOUT: FullTimeLayout = {
  width: 1080,
  height: 1350,
  title: { show: true, text: "", x: 540, y: 112, fontSize: 84, color: "#f6c744" },
  subtitle: { show: true, text: "", x: 540, y: 192, fontSize: 30, color: "#ffffff" },
  teams: {
    y: 480, crestSize: 250, nearX: 830, farX: 250, nameDy: 176,
    nameFontSize: 40, nameColor: "#ffffff", scoreFontSize: 150, scoreColor: "#ffffff",
    shootoutDy: 124, shootoutFontSize: 36, shootoutColor: "#f6c744",
  },
  scorers: {
    show: true, firstRowY: 860, rowHeight: 76, lastRowY: 1230, nearX: 810, farX: 270, columnWidth: 490,
    fontSize: 38, color: "#ffffff", minuteColor: "#f6c744",
  },
  footer: { show: true, text: "Choufsport", x: 540, y: 1298, fontSize: 22, color: "#ffffff" },
};
