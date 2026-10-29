import { forwardRef, type CSSProperties } from "react";
import { centred } from "./live/H2HPoster";
import type { MoroccanLayout } from "@/config/moroccanLayout";
import type { MoroccanHighlight } from "@/lib/moroccanHighlights";

interface Props {
  highlights: MoroccanHighlight[];
  layout: MoroccanLayout;
  templateSrc: string | null;
}

const ORDINALS = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];
export const ordinal = (rank: number) => ORDINALS[rank - 1] ?? `المركز ${rank}`;

function Img({ src, size, x, y, round, ring }: { src: string | null; size: number; x: number; y: number; round?: boolean; ring?: { width: number; color: string } }) {
  const box: CSSProperties = {
    position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", width: size, height: size,
    objectFit: round ? "cover" : "contain", borderRadius: round ? "50%" : undefined,
    background: round ? "#2b1a45" : undefined, boxSizing: "border-box",
    border: ring ? `${ring.width}px solid ${ring.color}` : undefined,
  };
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="" style={box} /> : round ? <div style={box} /> : null;
}

/**
 * Moroccan players' standout statistics: several highlights as a roundup, or
 * one player alone as a spotlight: the leaderboard place, the value and the
 * competition it was earned in. Every size and position comes from MoroccanLayout.
 */
const MoroccanPoster = forwardRef<HTMLDivElement, Props>(function MoroccanPoster({ highlights, layout, templateSrc }, ref) {
  const L = layout;
  const solo = highlights.length === 1 ? highlights[0] : null;
  const R = L.roundup;
  const S = L.spotlight;
  // However many are picked, they end above lastRowY: the pitch shrinks, and
  // everything inside a row with it.
  const pitch = highlights.length > 1 ? Math.min(R.rowHeight, (R.lastRowY - R.firstRowY) / (highlights.length - 1)) : R.rowHeight;
  const k = pitch / R.rowHeight;

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
        <div style={{ ...centred(L.title.x, L.title.y), fontSize: L.title.fontSize, fontWeight: 900, color: L.title.color }}>{L.title.text || "المغاربة في الصدارة"}</div>
      )}
      {L.subtitle.show && (
        <div style={{ ...centred(L.subtitle.x, L.subtitle.y), fontSize: L.subtitle.fontSize, fontWeight: 700, color: L.subtitle.color }}>{L.subtitle.text || "إحصائيات الموسم"}</div>
      )}

      {solo ? (
        <>
          <Img src={solo.photo} size={S.faceSize} x={L.width / 2} y={S.faceY} round ring={{ width: S.ringWidth, color: S.ringColor }} />
          <Img src={solo.clubLogo} size={S.clubSize} x={L.width / 2 + S.faceSize * 0.36} y={S.faceY + S.faceSize * 0.36} />
          <div style={{ ...centred(L.width / 2, S.nameY), fontSize: S.nameFontSize, fontWeight: 900, color: S.nameColor }}>{solo.name}</div>
          <div style={{ ...centred(L.width / 2, S.compY), display: "flex", alignItems: "center", gap: 12, fontSize: S.compFontSize, fontWeight: 700, color: S.compColor }}>
            {solo.competitionLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={solo.competitionLogo} alt="" style={{ width: S.compLogoSize, height: S.compLogoSize, objectFit: "contain" }} />
            )}
            <span>{solo.competition}</span>
          </div>
          <div style={{ ...centred(L.width / 2, S.valueY), direction: "ltr", fontSize: S.valueFontSize, fontWeight: 900, color: S.valueColor, lineHeight: 1 }}>{solo.value}</div>
          <div style={{ ...centred(L.width / 2, S.categoryY), fontSize: S.categoryFontSize, fontWeight: 800, color: S.categoryColor }}>{solo.category}</div>
          <div style={{ ...centred(L.width / 2, S.rankY), fontSize: S.rankFontSize, fontWeight: 700, color: S.rankColor }}>{ordinal(solo.rank)} في {solo.competition}</div>
        </>
      ) : (
        highlights.map((h, i) => {
          const y = R.firstRowY + i * pitch;
          const face = R.faceSize * k;
          return (
            <div key={h.key}>
              {R.card.show && (
                <div style={{
                  position: "absolute", left: R.card.insetX, top: y, transform: "translateY(-50%)",
                  width: L.width - 2 * R.card.insetX, height: R.card.height * k,
                  background: R.card.color, opacity: R.card.opacity, borderRadius: R.card.radius,
                }} />
              )}
              <Img src={h.photo} size={face} x={R.faceX} y={y} round ring={{ width: 3 * k, color: R.ringColor }} />
              <Img src={h.clubLogo} size={R.clubSize * k} x={R.faceX - face * 0.4} y={y + face * 0.36} />
              <div style={{ position: "absolute", right: L.width - R.nameRightX, top: y + R.nameDy * k, transform: "translateY(-50%)", fontSize: R.nameFontSize * k, fontWeight: 900, color: R.nameColor, whiteSpace: "nowrap" }}>{h.name}</div>
              <div style={{ position: "absolute", right: L.width - R.nameRightX, top: y + R.metaDy * k, transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 8, fontSize: R.metaFontSize * k, fontWeight: 700, color: R.metaColor, whiteSpace: "nowrap" }}>
                {h.competitionLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.competitionLogo} alt="" style={{ width: R.compLogoSize * k, height: R.compLogoSize * k, objectFit: "contain" }} />
                )}
                <span>{h.competition} · {h.category}</span>
              </div>
              <div style={{ ...centred(R.valueX, y), direction: "ltr", fontSize: R.valueFontSize * k, fontWeight: 900, color: R.valueColor }}>{h.value}</div>
              <div style={{ ...centred(R.rankX, y), width: R.rankSize * k, height: R.rankSize * k, borderRadius: "50%", background: R.rankBg, color: R.rankColor, fontSize: R.rankFontSize * k, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", direction: "ltr" }}>#{h.rank}</div>
            </div>
          );
        })
      )}

      {L.footer.show && (
        <div style={{ ...centred(L.footer.x, L.footer.y), fontSize: L.footer.fontSize, fontWeight: 700, color: L.footer.color, opacity: 0.6 }}>{L.footer.text || "Choufsport"}</div>
      )}
    </div>
  );
});

export default MoroccanPoster;
