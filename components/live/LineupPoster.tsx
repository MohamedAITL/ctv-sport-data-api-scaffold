import { Fragment, forwardRef, type CSSProperties } from "react";
import { centred, Crest } from "./H2HPoster";
import type { LineupLayout } from "@/config/lineupLayout";
import type { LineupPlayer, LiveMatch, LiveTeam, TeamLineup } from "@/types/live";

export type LineupTeams = "both" | "home" | "away";

interface Props {
  match: LiveMatch;
  home: TeamLineup;
  away: TeamLineup;
  /** Both XIs facing each other, or one team alone on the whole pitch. */
  team: LineupTeams;
  layout: LineupLayout;
  templateSrc: string | null;
}

const LINE = 3; // pitch-marking stroke, px
const pct = (v: number | null) => Math.min(100, Math.max(0, v ?? 50));
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/**
 * Where a player stands on the poster, in poster pixels.
 *
 * `line` is depth from the team's own goal and `side` runs from the team's own
 * left (0) to its right (100) — Davies, Calafiori and Dimarco all come back as
 * 0. Home attacks up the poster, so its left is the viewer's left; the away
 * side faces it and is mirrored. Each half keeps its front line `midGap` short
 * of halfway, so two strike partnerships never land on top of each other.
 *
 * A team alone (`alone` = how much bigger it is drawn) attacks up whichever
 * side it is and spreads over the whole pitch, its front line `midGap` short
 * of the far end. Its keeper's gap grows with the players, or his bigger name
 * would hang over the goal line.
 */
export function spot(p: Pick<LineupPlayer, "line" | "side">, home: boolean, P: LineupLayout["pitch"], alone?: number) {
  const goal = alone ? P.goalPad * alone : P.goalPad;
  const reach = alone ? P.h - 2 * goal - P.midGap : P.h / 2 - goal - P.midGap;
  const depth = (pct(p.line) / 100) * reach;
  const lateral = (pct(p.side) / 100) * (P.w - 2 * P.sidePad);
  const up = home || Boolean(alone);
  return {
    x: P.x + (up ? P.sidePad + lateral : P.w - P.sidePad - lateral),
    y: P.y + (up ? P.h - goal - depth : goal + depth),
  };
}

/** Halfway line, centre circle and spot, and both ends: box, six-yard box, spot, D. */
export function Markings({ w, h, color }: { w: number; h: number; color: string }) {
  const stroke = `${LINE}px solid ${color}`;
  const box = (bw: number, bh: number, top: boolean): CSSProperties => ({
    position: "absolute", left: (w - bw) / 2, width: bw, height: bh, boxSizing: "border-box", border: stroke,
    ...(top ? { top: 0, borderTop: "none" } : { bottom: 0, borderBottom: "none" }),
  });
  const dot = (y: number): CSSProperties => ({
    position: "absolute", left: w / 2 - 5, top: y - 5, width: 10, height: 10, borderRadius: "50%", background: color,
  });
  const circle = w * 0.22;
  const pen = { w: w * 0.58, h: h * 0.15 };
  const six = { w: w * 0.27, h: h * 0.055 };
  const arc = { w: w * 0.2, h: h * 0.045 };
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: h / 2 - LINE / 2, height: LINE, background: color }} />
      <div style={{ position: "absolute", left: (w - circle) / 2, top: (h - circle) / 2, width: circle, height: circle, borderRadius: "50%", border: stroke, boxSizing: "border-box" }} />
      <div style={dot(h / 2)} />
      {[true, false].map((top) => (
        <Fragment key={String(top)}>
          <div style={box(pen.w, pen.h, top)} />
          <div style={box(six.w, six.h, top)} />
          <div style={dot(top ? h * 0.11 : h - h * 0.11)} />
          <div style={{
            position: "absolute", left: (w - arc.w) / 2, width: arc.w, height: arc.h, boxSizing: "border-box", border: stroke,
            ...(top
              ? { top: pen.h - LINE, borderTop: "none", borderRadius: "0 0 50% 50% / 0 0 100% 100%" }
              : { bottom: pen.h - LINE, borderBottom: "none", borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }),
          }} />
        </Fragment>
      ))}
    </>
  );
}

/**
 * The lineups poster: both starting XIs on one vertical pitch, 1080x1350 — the
 * same export contract as the other posters, every value driven by
 * LineupLayout so the panel can edit it.
 */
const LineupPoster = forwardRef<HTMLDivElement, Props>(function LineupPoster(
  { match, home, away, team, layout, templateSrc },
  ref
) {
  const L = layout;
  const single = team !== "both";
  const k = single ? L.singleScale : 1;
  const P = L.pitch;
  const T = L.teams;
  const M = L.player;
  const line = rgba(P.lineColor, P.lineOpacity);
  const grass = P.stripeHeight > 0
    ? `repeating-linear-gradient(180deg, ${P.color} 0px, ${P.color} ${P.stripeHeight}px, ${P.stripeColor} ${P.stripeHeight}px, ${P.stripeColor} ${P.stripeHeight * 2}px)`
    : P.color;

  const man = (p: LineupPlayer, isHome: boolean) => {
    const { x, y } = spot(p, isHome, P, single ? k : undefined);
    const color = isHome ? M.homeColor : M.awayColor;
    const ink = isHome ? M.homeInk : M.awayInk;
    const face = M.photos && p.photo;
    const size = M.size * k;
    const badge = Math.round(M.numberFontSize * k * 1.75);
    return (
      <Fragment key={`${isHome ? "h" : "a"}${p.id}`}>
        <div style={{
          position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)",
          width: size, height: size, borderRadius: "50%", boxSizing: "border-box",
          border: `${M.ring}px solid ${color}`, background: face ? "#e9e4f0" : color, overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {face ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photo as string} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            M.numberShow && <span style={{ fontSize: size * 0.42, fontWeight: 900, color: ink }}>{p.number ?? ""}</span>
          )}
        </div>
        {face && M.numberShow && p.number !== null && (
          <div style={{
            ...centred(x + size * 0.38, y + size * 0.32), width: badge, height: badge, borderRadius: "50%",
            background: color, color: ink, fontSize: M.numberFontSize * k, fontWeight: 900, lineHeight: `${badge}px`,
          }}>{p.number}</div>
        )}
        {M.nameShow && (
          <div style={{
            ...centred(x, y + M.nameDy * k), maxWidth: M.nameMaxWidth * k, overflow: "hidden", textOverflow: "ellipsis",
            fontSize: M.nameFontSize * k, fontWeight: 800, color: M.nameColor, lineHeight: 1.35,
            background: rgba(M.nameBg, M.nameBgOpacity), padding: "1px 10px", borderRadius: 8,
          }}>{p.shortName || p.name}</div>
        )}
      </Fragment>
    );
  };

  // A team's bar: crest, name, and its formation and coach. The opponent's bar
  // under a single team is the same shape, prefixed "ضد" and without the meta.
  const bar = (team: LiveTeam, lu: TeamLineup | null, y: number, prefix = "") => {
    const meta = lu ? [
      T.formationShow ? lu.formation : null,
      T.coachShow && lu.coach ? `المدرب: ${lu.coach.name}` : null,
    ].filter(Boolean).join(" · ") : "";
    return (
      <>
        <Crest src={team.logo} size={T.crestSize} x={T.crestX} y={y} />
        <div style={{
          position: "absolute", right: L.width - (T.crestX - T.crestSize / 2 - 14), top: y, transform: "translateY(-50%)",
          maxWidth: 480, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontSize: T.nameFontSize, fontWeight: 800, color: T.nameColor,
        }}>{prefix ? `${prefix} ${team.name}` : team.name}</div>
        {meta && (
          <div style={{
            position: "absolute", left: T.metaX, top: y, transform: "translateY(-50%)",
            maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            fontSize: T.metaFontSize, fontWeight: 700, color: T.metaColor,
          }}>{meta}</div>
        )}
      </>
    );
  };

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
          {L.title.text || "التشكيلة الرسمية"}
        </div>
      )}
      {L.subtitle.show && (
        <div style={{ ...centred(L.subtitle.x, L.subtitle.y), fontSize: L.subtitle.fontSize, fontWeight: 700, color: L.subtitle.color }}>
          {L.subtitle.text || match.competition}
        </div>
      )}

      {/* Both: away above the pitch, home below. Alone: the team heads it. */}
      {T.show && team !== "home" && bar(match.away, away, T.awayY)}
      {T.show && team === "home" && bar(match.home, home, T.awayY)}

      <div style={{
        position: "absolute", left: P.x, top: P.y, width: P.w, height: P.h, boxSizing: "border-box",
        border: `${LINE}px solid ${line}`, borderRadius: P.radius, overflow: "hidden", background: grass,
      }}>
        <Markings w={P.w - 2 * LINE} h={P.h - 2 * LINE} color={line} />
      </div>

      {team !== "home" && away.starting.map((p) => man(p, false))}
      {team !== "away" && home.starting.map((p) => man(p, true))}

      {T.show && team === "both" && bar(match.home, home, T.homeY)}
      {T.show && single && L.opponent.show &&
        bar(team === "home" ? match.away : match.home, null, T.homeY, L.opponent.text || "ضد")}

      {L.footer.show && (
        <div style={{ ...centred(L.footer.x, L.footer.y), fontSize: L.footer.fontSize, fontWeight: 700, color: L.footer.color, opacity: 0.6 }}>
          {L.footer.text || "Choufsport"}
        </div>
      )}
    </div>
  );
});

export default LineupPoster;
