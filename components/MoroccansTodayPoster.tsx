import { forwardRef } from "react";
import { centred } from "./live/H2HPoster";
import PlayerSpotlight, { Img } from "./PlayerSpotlight";
import type { MoroccansTodayLayout } from "@/config/moroccansTodayLayout";
import type { MoroccanLine } from "@/lib/moroccanDay";
import { POSTER_FONT } from "@/config/posterFont";

interface Props {
  title: string;
  /** The title when the poster holds one player: "the Moroccans" would be wrong. */
  soloTitle: string;
  subtitle: string;
  lines: MoroccanLine[];
  layout: MoroccansTodayLayout;
  templateSrc: string | null;
}

/** A row per Moroccan: face, match, and what he did. Every size comes from the layout. */
const MoroccansTodayPoster = forwardRef<HTMLDivElement, Props>(function MoroccansTodayPoster({ title, soloTitle, subtitle, lines, layout, templateSrc }, ref) {
  const L = layout;
  const R = L.rows;
  // However many are picked, the list ends above lastRowY.
  const pitch = lines.length > 1 ? Math.min(R.rowHeight, (R.lastRowY - R.firstRowY) / (lines.length - 1)) : R.rowHeight;
  const k = pitch / R.rowHeight;
  const solo = lines.length === 1 ? lines[0] : null;

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
      {!solo && L.title.show && (
        <div style={{ ...centred(L.title.x, L.title.y), fontSize: L.title.fontSize, fontWeight: 900, color: L.title.color }}>{L.title.text || title}</div>
      )}
      {!solo && L.subtitle.show && (L.subtitle.text || subtitle) && (
        <div style={{ ...centred(L.subtitle.x, L.subtitle.y), fontSize: L.subtitle.fontSize, fontWeight: 700, color: L.subtitle.color }}>{L.subtitle.text || subtitle}</div>
      )}

      {solo && (
        <PlayerSpotlight
          width={L.width} layout={L.player} photo={solo.photo} clubLogo={solo.clubLogo} name={solo.name} chip={solo.meta} stats={solo.stats}
          title={L.title.show ? L.title.text || soloTitle : null} subtitle={L.subtitle.show ? L.subtitle.text || subtitle : null}
        />
      )}

      {!solo && lines.map((l, i) => {
        const y = R.firstRowY + i * pitch;
        const face = R.faceSize * k;
        return (
          <div key={l.key}>
            {R.card.show && (
              <div style={{
                position: "absolute", left: R.card.insetX, top: y, transform: "translateY(-50%)",
                width: L.width - 2 * R.card.insetX, height: R.card.height * k,
                background: R.card.color, opacity: R.card.opacity, borderRadius: R.card.radius,
              }} />
            )}
            <Img src={l.photo} size={face} x={R.faceX} y={y} round ring={{ width: 3 * k, color: R.ringColor }} />
            <Img src={l.clubLogo} size={R.clubSize * k} x={R.faceX - face * 0.4} y={y + face * 0.36} />
            <div style={{ position: "absolute", right: L.width - R.nameRightX, top: y + R.nameDy * k, transform: "translateY(-50%)", fontSize: R.nameFontSize * k, fontWeight: 900, color: R.nameColor, whiteSpace: "nowrap" }}>{l.name}</div>
            <div style={{ position: "absolute", right: L.width - R.nameRightX, top: y + R.metaDy * k, transform: "translateY(-50%)", fontSize: R.metaFontSize * k, fontWeight: 700, color: R.metaColor, whiteSpace: "nowrap" }}>{l.meta}</div>
            <div style={{ position: "absolute", left: R.chipLeftX, top: y, transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 * k }}>
              {l.chips.map((c) => (
                <span key={c} style={{ padding: `${2 * k}px ${14 * k}px`, fontSize: R.chipFontSize * k, fontWeight: 800, lineHeight: 1.3, color: R.chipColor, background: R.chipBg, borderRadius: R.chipRadius, whiteSpace: "nowrap" }}>{c}</span>
              ))}
            </div>
          </div>
        );
      })}

      {L.footer.show && (
        <div style={{ ...centred(L.footer.x, L.footer.y), fontSize: L.footer.fontSize, fontWeight: 700, color: L.footer.color, opacity: 0.6 }}>
          {L.footer.text || "Choufsport"}
        </div>
      )}
    </div>
  );
});

export default MoroccansTodayPoster;
