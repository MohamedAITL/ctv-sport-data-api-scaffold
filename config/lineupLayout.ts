// Lineups poster layout (1080x1350): both starting XIs on one vertical pitch,
// home attacking up from the bottom, away facing them from the top. Home of
// every editable value for the poster the live section exports from its
// التشكيلة tab.
export interface LineupText { show: boolean; text?: string; x: number; y: number; fontSize: number; color: string }

export interface LineupLayout {
  width: number;
  height: number;
  title: LineupText;
  subtitle: LineupText;
  pitch: {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    stripeColor: string;
    stripeHeight: number; // 0 = flat grass
    lineColor: string;
    lineOpacity: number;
    radius: number;
    goalPad: number; // the goalkeeper's distance from his goal line
    midGap: number; // the front line's distance from the halfway line
    sidePad: number; // the full-backs' and wingers' distance from the touchline
  };
  teams: {
    show: boolean;
    awayY: number; // the bar above the pitch
    homeY: number; // the bar below it
    crestSize: number;
    crestX: number;
    nameFontSize: number;
    nameColor: string;
    formationShow: boolean;
    coachShow: boolean;
    metaX: number;
    metaFontSize: number;
    metaColor: string;
  };
  player: {
    size: number;
    photos: boolean; // off: a shirt-number disc instead of the face
    ring: number;
    homeColor: string;
    awayColor: string;
    homeInk: string; // the number's colour on the home colour
    awayInk: string;
    numberShow: boolean;
    numberFontSize: number;
    nameShow: boolean;
    nameDy: number;
    nameFontSize: number;
    nameColor: string;
    nameMaxWidth: number;
    nameBg: string;
    nameBgOpacity: number;
  };
  footer: LineupText;
}

// Pitch 1040px tall: a 4-2-3-1 puts five rows in each half, and at this
// height they sit ~98px apart, enough for a face plus its name.
export const DEFAULT_LINEUP_LAYOUT: LineupLayout = {
  width: 1080,
  height: 1350,
  title: { show: true, text: "التشكيلة الرسمية", x: 540, y: 50, fontSize: 44, color: "#ffffff" },
  subtitle: { show: true, text: "", x: 540, y: 94, fontSize: 24, color: "#f6c744" },
  pitch: {
    x: 50, y: 176, w: 980, h: 1040,
    color: "#19573a", stripeColor: "#1e6443", stripeHeight: 65,
    lineColor: "#ffffff", lineOpacity: 0.55, radius: 18,
    goalPad: 62, midGap: 64, sidePad: 86,
  },
  teams: {
    show: true, awayY: 140, homeY: 1254,
    crestSize: 50, crestX: 1000,
    nameFontSize: 28, nameColor: "#ffffff",
    formationShow: true, coachShow: true,
    metaX: 80, metaFontSize: 21, metaColor: "#d9cfe6",
  },
  player: {
    size: 62, photos: true, ring: 3,
    homeColor: "#fe8c0c", awayColor: "#645ba4", homeInk: "#1a1420", awayInk: "#ffffff",
    numberShow: true, numberFontSize: 15,
    nameShow: true, nameDy: 47, nameFontSize: 19, nameColor: "#ffffff", nameMaxWidth: 170,
    nameBg: "#000000", nameBgOpacity: 0.45,
  },
  footer: { show: true, text: "Choufsport", x: 540, y: 1316, fontSize: 20, color: "#ffffff" },
};
