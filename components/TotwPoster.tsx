import { Fragment, forwardRef, type CSSProperties } from "react";
import { centred, Crest } from "./live/H2HPoster";
import { Markings, spot } from "./live/LineupPoster";
import type { TotwLayout } from "@/config/totwLayout";
import type { TotwPlayer } from "@/lib/totw";

export interface TotwSlot { line: number | null; side: number | null; player: TotwPlayer | null }

interface Props {
  subtitle: string;
  slots: TotwSlot[];
  coach: TotwPlayer | null;
  formation: string | null;
  layout: TotwLayout;
  templateSrc: string | null;
}

const LINE = 3;
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/**
 * The team of the round: one XI up a vertical pitch, 1080x1350 — the export
 * contract of the other posters, every value from TotwLayout. Placement is the
 * lineup poster's (`spot`, one team attacking up), so a player stands where
 * 365scores puts him.
 */
const TotwPoster = forwardRef<HTMLDivElement, Props>(function TotwPoster(
  { subtitle, slots, coach, formation, layout, templateSrc },
  ref
) {
  const L = layout;
  const P = L.pitch;
  const M = L.player;
  const C = L.coach;
  const line = rgba(P.lineColor, P.lineOpacity);
  const grass = P.stripeHeight > 0
    ? `repeating-linear-gradient(180deg, ${P.color} 0px, ${P.color} ${P.stripeHeight}px, ${P.stripeColor} ${P.stripeHeight}px, ${P.stripeColor} ${P.stripeHeight * 2}px)`
    : P.color;

  const man = (s: TotwSlot, i: number) => {
    const { x, y } = spot(s, true, P, 1);
    const p = s.player;
    const face: CSSProperties = {
      position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)",
      width: M.size, height: M.size, borderRadius: "50%", boxSizing: "border-box", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
    };
    if (!p) {
      // An unpicked slot, so the shape of the formation shows while you build it.
      return <div key={i} style={{ ...face, border: `${M.ring}px dashed ${M.ringColor}`, background: "rgba(0,0,0,.25)", color: M.ringColor, fontSize: M.size * 0.4, fontWeight: 900 }}>+</div>;
    }
    const chip = Math.round(M.ratingFontSize * 2.4);
    return (
      <Fragment key={i}>
        <div style={{ ...face, border: `${M.ring}px solid ${M.ringColor}`, background: "#e9e4f0" }}>
          {p.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
        {M.crestShow && p.club?.logo && (
          <Crest src={p.club.logo} size={M.crestSize} x={x - M.size * 0.4} y={y + M.size * 0.32} />
        )}
        {M.ratingShow && p.rating !== null && (
          <div style={{
            ...centred(x + M.size * 0.42, y - M.size * 0.36), minWidth: chip, padding: "2px 8px", borderRadius: 999,
            background: M.ratingBg, color: M.ratingColor, fontSize: M.ratingFontSize, fontWeight: 900, direction: "ltr",
          }}>{p.rating.toFixed(1)}</div>
        )}
        <div style={{
          ...centred(x, y + M.nameDy), maxWidth: M.nameMaxWidth, overflow: "hidden", textOverflow: "ellipsis",
          fontSize: M.nameFontSize, fontWeight: 800, color: M.nameColor, lineHeight: 1.35,
          background: rgba(M.nameBg, M.nameBgOpacity), padding: "1px 12px", borderRadius: 9,
        }}>{p.shortName || p.name}</div>
      </Fragment>
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
          {L.title.text || "تشكيلة الجولة"}
        </div>
      )}
      {L.subtitle.show && (
        <div style={{ ...centred(L.subtitle.x, L.subtitle.y), fontSize: L.subtitle.fontSize, fontWeight: 700, color: L.subtitle.color }}>
          {L.subtitle.text || subtitle}
        </div>
      )}

      <div style={{
        position: "absolute", left: P.x, top: P.y, width: P.w, height: P.h, boxSizing: "border-box",
        border: `${LINE}px solid ${line}`, borderRadius: P.radius, overflow: "hidden", background: grass,
      }}>
        <Markings w={P.w - 2 * LINE} h={P.h - 2 * LINE} color={line} />
      </div>

      {slots.map(man)}

      {C.show && coach && (
        <>
          {coach.club?.logo && <Crest src={coach.club.logo} size={C.crestSize} x={C.crestX} y={C.y} />}
          <div style={{
            position: "absolute", right: L.width - (C.crestX - C.crestSize / 2 - 14), top: C.y, transform: "translateY(-50%)",
            maxWidth: 560, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            fontSize: C.fontSize, fontWeight: 800, color: C.color,
          }}>المدرب: {coach.name}</div>
        </>
      )}
      {C.formationShow && formation && (
        <div style={{
          position: "absolute", left: C.formationX, top: C.y, transform: "translateY(-50%)",
          fontSize: C.formationFontSize, fontWeight: 800, color: C.formationColor, direction: "ltr",
        }}>{formation}</div>
      )}

      {L.footer.show && (
        <div style={{ ...centred(L.footer.x, L.footer.y), fontSize: L.footer.fontSize, fontWeight: 700, color: L.footer.color, opacity: 0.6 }}>
          {L.footer.text || "Choufsport"}
        </div>
      )}
    </div>
  );
});

export default TotwPoster;
