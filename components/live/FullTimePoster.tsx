import { forwardRef } from "react";
import { Crest, centred } from "./H2HPoster";
import type { FullTimeLayout } from "@/config/fullTimeLayout";
import type { Goal, LiveMatch } from "@/types/live";
import { POSTER_FONT } from "@/config/posterFont";

interface Props {
  match: LiveMatch;
  goals: Goal[];
  shootout: { home: number; away: number } | null;
  layout: FullTimeLayout;
  templateSrc: string | null;
}

const MARK = { field: "", penalty: " (ض.ج)", own: " (ه.ذ)" } as const;
const CHAR_EM = 0.5; // Rubik's average glyph width at these weights
const NAME_WIDTH = 400; // a name stays within its side of the poster

/** The size that keeps `text` within `width`: a name must never be cut off. */
export const fitFont = (text: string, size: number, width: number) =>
  size * Math.min(1, width / (text.length * CHAR_EM * size));

/** One line per scorer on a side, in order: two goals share a line. */
export function scorerLines(goals: Goal[], home: boolean): Array<{ name: string; minutes: string }> {
  const lines = new Map<string, string[]>();
  for (const g of goals) {
    if (g.home !== home) continue;
    const name = g.player ?? "هدف";
    lines.set(name, [...(lines.get(name) ?? []), `${g.minute}${MARK[g.kind]}`]);
  }
  return Array.from(lines, ([name, minutes]) => ({ name, minutes: minutes.join(" ، ") }));
}

/**
 * The result: both sides, the score and who scored. A match still running says
 * so in its title, so this can be posted at half time without claiming a result.
 * Home is on the right, as on every other poster.
 */
const FullTimePoster = forwardRef<HTMLDivElement, Props>(function FullTimePoster({ match, goals, shootout, layout, templateSrc }, ref) {
  const L = layout;
  const T = L.teams;
  const S = L.scorers;
  const title = L.title.text || (match.isFinished ? "نهاية المباراة" : [match.statusText, match.clock].filter(Boolean).join(" "));
  const subtitle = L.subtitle.text || match.competition;
  const near = scorerLines(goals, true);
  const far = scorerLines(goals, false);
  const rows = S.show ? Math.max(near.length, far.length) : 0;
  // However many scored, the list ends above lastRowY.
  const pitch = rows > 1 ? Math.min(S.rowHeight, (S.lastRowY - S.firstRowY) / (rows - 1)) : S.rowHeight;
  const k = pitch / S.rowHeight;
  // The teams and the scorers are one block, centred: fewer scorers, lower teams.
  const drop = (S.lastRowY - (rows ? S.firstRowY + (rows - 1) * pitch : T.y + T.nameDy)) / 2;
  const teamY = T.y + drop;

  // A long line shrinks to its column: a goal must never be cut off.
  const column = (lines: typeof near, x: number) => lines.map((l, i) => (
    <div key={`${x}-${l.name}`} style={{
      ...centred(x, S.firstRowY + drop + i * pitch), fontWeight: 800, color: S.color,
      fontSize: fitFont(`${l.name} ${l.minutes}`, S.fontSize * k, S.columnWidth),
    }}>
      {l.name} <span style={{ color: S.minuteColor, fontWeight: 900, direction: "ltr", unicodeBidi: "isolate" }}>{l.minutes}</span>
    </div>
  ));

  return (
    <div
      ref={ref}
      style={{
        position: "relative", width: L.width, height: L.height, overflow: "hidden",
        fontFamily: POSTER_FONT, color: "#ffffff", direction: "rtl",
        background: templateSrc ? "#2b1a45" : "linear-gradient(160deg,#3a1d55 0%,#2a1340 55%,#45205f 100%)",
      }}
    >
      {templateSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={templateSrc} alt="" width={L.width} height={L.height} style={{ position: "absolute", inset: 0, width: L.width, height: L.height, objectFit: "cover" }} />
      )}

      {L.title.show && title && (
        <div style={{ ...centred(L.title.x, L.title.y), fontSize: L.title.fontSize, fontWeight: 900, color: L.title.color }}>{title}</div>
      )}
      {L.subtitle.show && subtitle && (
        <div style={{ ...centred(L.subtitle.x, L.subtitle.y), fontSize: L.subtitle.fontSize, fontWeight: 700, color: L.subtitle.color }}>{subtitle}</div>
      )}

      <Crest src={match.home.logo} size={T.crestSize} x={T.nearX} y={teamY} />
      <Crest src={match.away.logo} size={T.crestSize} x={T.farX} y={teamY} />
      <div style={{ ...centred(T.nearX, teamY + T.nameDy), fontSize: fitFont(match.home.name, T.nameFontSize, NAME_WIDTH), fontWeight: 900, color: T.nameColor }}>{match.home.name}</div>
      <div style={{ ...centred(T.farX, teamY + T.nameDy), fontSize: fitFont(match.away.name, T.nameFontSize, NAME_WIDTH), fontWeight: 900, color: T.nameColor }}>{match.away.name}</div>
      {/* Left to right, following the crests: away on the left, home on the right. */}
      <div style={{ ...centred(L.width / 2, teamY), direction: "ltr", fontSize: T.scoreFontSize, fontWeight: 900, color: T.scoreColor }}>
        {`${match.away.score ?? 0} - ${match.home.score ?? 0}`}
      </div>
      {shootout && (
        <div style={{ ...centred(L.width / 2, teamY + T.shootoutDy), fontSize: T.shootoutFontSize, fontWeight: 800, color: T.shootoutColor }}>
          ر.ج <span style={{ direction: "ltr", unicodeBidi: "isolate" }}>{`${shootout.away} - ${shootout.home}`}</span>
        </div>
      )}

      {S.show && column(near, S.nearX)}
      {S.show && column(far, S.farX)}

      {L.footer.show && (
        <div style={{ ...centred(L.footer.x, L.footer.y), fontSize: L.footer.fontSize, fontWeight: 700, color: L.footer.color, opacity: 0.6 }}>
          {L.footer.text || "Choufsport"}
        </div>
      )}
    </div>
  );
});

export default FullTimePoster;
