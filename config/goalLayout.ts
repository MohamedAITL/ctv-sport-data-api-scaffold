// Goal poster layout (1080x1350). Home of every editable value for the poster
// the live section exports from a goal.
export interface GoalText { show: boolean; text?: string; x: number; y: number; fontSize: number; color: string }

export interface GoalLayout {
  width: number;
  height: number;
  title: GoalText;
  subtitle: GoalText;
  face: { show: boolean; x: number; y: number; size: number; ringWidth: number; ringColor: string; background: string };
  name: GoalText;
  minute: { show: boolean; x: number; y: number; fontSize: number; color: string; background: string; radius: number };
  score: {
    show: boolean;
    y: number;
    crestSize: number;
    nearX: number; // home, on the right
    farX: number;
    nameDy: number;
    nameFontSize: number;
    nameColor: string;
    fontSize: number;
    color: string;
  };
  footer: GoalText;
}

export const DEFAULT_GOAL_LAYOUT: GoalLayout = {
  width: 1080,
  height: 1350,
  title: { show: true, text: "", x: 540, y: 104, fontSize: 112, color: "#f6c744" },
  subtitle: { show: true, text: "", x: 540, y: 196, fontSize: 30, color: "#ffffff" },
  face: { show: true, x: 540, y: 520, size: 500, ringWidth: 12, ringColor: "#f6c744", background: "#3b2a5e" },
  name: { show: true, x: 540, y: 838, fontSize: 76, color: "#ffffff" },
  minute: { show: true, x: 540, y: 930, fontSize: 40, color: "#2a1340", background: "#f6c744", radius: 14 },
  score: {
    show: true, y: 1120, crestSize: 132, nearX: 850, farX: 230, nameDy: 100,
    nameFontSize: 30, nameColor: "#ffffff", fontSize: 112, color: "#ffffff",
  },
  footer: { show: true, text: "Choufsport", x: 540, y: 1298, fontSize: 22, color: "#ffffff" },
};
