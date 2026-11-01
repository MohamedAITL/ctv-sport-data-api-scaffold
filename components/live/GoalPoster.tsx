import { forwardRef } from "react";
import { Crest, centred } from "./H2HPoster";
import { fitFont } from "./FullTimePoster";
import type { GoalLayout } from "@/config/goalLayout";
import type { Goal, LiveMatch } from "@/types/live";

interface Props {
  match: LiveMatch;
  goal: Goal;
  /** The score to print: after this goal, or the match score when the two disagree. */
  score: { home: number | null; away: number | null };
  layout: GoalLayout;
  templateSrc: string | null;
}

const HEADLINE = { field: "هدف!", penalty: "هدف!", own: "هدف ذاتي" } as const;

/**
 * One goal: the scorer's face, the minute, and the score it left. An own goal
 * counts for the side it helped, so the score stays right; the headline says so.
 * Home is on the right, as on every other poster.
 */
const GoalPoster = forwardRef<HTMLDivElement, Props>(function GoalPoster({ match, goal, score, layout, templateSrc }, ref) {
  const L = layout;
  const S = L.score;
  const side = goal.home ? match.home : match.away;
  const subtitle = L.subtitle.text || [match.competition, goal.kind === "penalty" ? "ركلة جزاء" : ""].filter(Boolean).join(" · ");

  return (
    <div
      ref={ref}
      style={{
        position: "relative", width: L.width, height: L.height, overflow: "hidden",
        fontFamily: "Cairo, sans-serif", color: "#ffffff", direction: "rtl",
        background: templateSrc ? "#2b1a45" : "linear-gradient(160deg,#3a1d55 0%,#2a1340 55%,#45205f 100%)",
      }}
    >
      {templateSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={templateSrc} alt="" width={L.width} height={L.height} style={{ position: "absolute", inset: 0, width: L.width, height: L.height, objectFit: "cover" }} />
      )}

      {L.title.show && (
        <div style={{ ...centred(L.title.x, L.title.y), fontSize: L.title.fontSize, fontWeight: 900, color: L.title.color }}>
          {L.title.text || HEADLINE[goal.kind]}
        </div>
      )}
      {L.subtitle.show && subtitle && (
        <div style={{ ...centred(L.subtitle.x, L.subtitle.y), fontSize: L.subtitle.fontSize, fontWeight: 700, color: L.subtitle.color }}>{subtitle}</div>
      )}

      {L.face.show && (
        <div style={{
          position: "absolute", left: L.face.x, top: L.face.y, transform: "translate(-50%, -50%)",
          width: L.face.size, height: L.face.size, borderRadius: "50%", overflow: "hidden",
          boxSizing: "border-box", border: `${L.face.ringWidth}px solid ${L.face.ringColor}`, background: L.face.background,
        }}>
          {goal.photo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={goal.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <Crest src={side.logo} size={L.face.size * .6} x={L.face.size / 2 - L.face.ringWidth} y={L.face.size / 2 - L.face.ringWidth} />}
        </div>
      )}

      {L.name.show && goal.player && (
        <div style={{ ...centred(L.name.x, L.name.y), fontSize: fitFont(goal.player ?? "", L.name.fontSize, L.width - 180), fontWeight: 900, color: L.name.color }}>
          {goal.player}
        </div>
      )}
      {L.minute.show && goal.minute && (
        <div style={{ ...centred(L.minute.x, L.minute.y), direction: "ltr", padding: "4px 30px", fontSize: L.minute.fontSize, fontWeight: 900, color: L.minute.color, background: L.minute.background, borderRadius: L.minute.radius }}>
          {goal.minute}
        </div>
      )}

      {S.show && (
        <>
          <Crest src={match.home.logo} size={S.crestSize} x={S.nearX} y={S.y} />
          <Crest src={match.away.logo} size={S.crestSize} x={S.farX} y={S.y} />
          <div style={{ ...centred(S.nearX, S.y + S.nameDy), fontSize: fitFont(match.home.name, S.nameFontSize, 360), fontWeight: 800, color: S.nameColor }}>{match.home.name}</div>
          <div style={{ ...centred(S.farX, S.y + S.nameDy), fontSize: fitFont(match.away.name, S.nameFontSize, 360), fontWeight: 800, color: S.nameColor }}>{match.away.name}</div>
          {/* Left to right, following the crests: away on the left, home on the right. */}
          <div style={{ ...centred(L.width / 2, S.y), direction: "ltr", fontSize: S.fontSize, fontWeight: 900, color: S.color }}>
            {`${score.away ?? 0} - ${score.home ?? 0}`}
          </div>
        </>
      )}

      {L.footer.show && (
        <div style={{ ...centred(L.footer.x, L.footer.y), fontSize: L.footer.fontSize, fontWeight: 700, color: L.footer.color, opacity: 0.6 }}>
          {L.footer.text || "Choufsport"}
        </div>
      )}
    </div>
  );
});

export default GoalPoster;
