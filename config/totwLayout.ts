// Team-of-the-round poster layout (1080x1350): one XI attacking up a vertical
// pitch, each player with face, name, club crest and rating, and the coach of
// the round under it. Home of every editable value for the poster.
import { DEFAULT_LINEUP_LAYOUT, type LineupLayout } from "./lineupLayout";

export interface TotwText { show: boolean; text?: string; x: number; y: number; fontSize: number; color: string }

export interface TotwLayout {
  width: number;
  height: number;
  title: TotwText;
  subtitle: TotwText; // empty text = competition · round
  pitch: LineupLayout["pitch"];
  player: {
    size: number;
    ring: number;
    ringColor: string;
    nameDy: number;
    nameFontSize: number;
    nameColor: string;
    nameMaxWidth: number;
    nameBg: string;
    nameBgOpacity: number;
    crestShow: boolean;
    crestSize: number;
    ratingShow: boolean;
    ratingFontSize: number;
    ratingColor: string;
    ratingBg: string;
  };
  coach: {
    show: boolean;
    y: number;
    crestSize: number;
    crestX: number;
    fontSize: number;
    color: string;
    formationShow: boolean;
    formationX: number;
    formationFontSize: number;
    formationColor: string;
  };
  footer: TotwText;
}

// One team has the whole pitch, so the faces are big (100px). A five-row
// formation puts its rows ~200px apart at this height, with room for the
// rating above a face and the name below it.
export const DEFAULT_TOTW_LAYOUT: TotwLayout = {
  width: 1080,
  height: 1350,
  title: { show: true, text: "تشكيلة الجولة", x: 540, y: 56, fontSize: 48, color: "#ffffff" },
  subtitle: { show: true, text: "", x: 540, y: 108, fontSize: 26, color: "#f6c744" },
  pitch: { ...DEFAULT_LINEUP_LAYOUT.pitch, y: 150, h: 1060, goalPad: 92, midGap: 40 },
  player: {
    size: 100, ring: 4, ringColor: "#fe8c0c",
    nameDy: 66, nameFontSize: 26, nameColor: "#ffffff", nameMaxWidth: 230,
    nameBg: "#000000", nameBgOpacity: 0.5,
    crestShow: true, crestSize: 40,
    ratingShow: true, ratingFontSize: 20, ratingColor: "#ffffff", ratingBg: "#1f9d55",
  },
  coach: {
    show: true, y: 1258, crestSize: 50, crestX: 1000, fontSize: 26, color: "#ffffff",
    formationShow: true, formationX: 80, formationFontSize: 26, formationColor: "#d9cfe6",
  },
  footer: { show: true, text: "Choufsport", x: 540, y: 1318, fontSize: 20, color: "#ffffff" },
};
