import { forwardRef } from "react";
import { centred } from "./live/H2HPoster";
import PlayerSpotlight, { Img, MAX_TILES, type SpotlightStat } from "./PlayerSpotlight";
import { DEFAULT_MOROCCAN_LAYOUT, type MoroccanLayout } from "@/config/moroccanLayout";
import type { MoroccanHighlight } from "@/lib/moroccanHighlights";
import { POSTER_FONT } from "@/config/posterFont";

interface Props {
  highlights: MoroccanHighlight[];
  layout: MoroccanLayout;
  templateSrc: string | null;
}

const ORDINALS = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];
export const ordinal = (rank: number) => ORDINALS[rank - 1] ?? `المركز ${rank}`;

/** Picks that are all one player make his own poster, however many there are. */
export const onePlayer = (list: MoroccanHighlight[]) =>
  list.length > 0 && list.every((h) => h.playerId === list[0].playerId);

/** What the poster prints: one player's best stats (the tiles hold six), or every pick. */
export const posterHighlights = (list: MoroccanHighlight[]) => (onePlayer(list)
  ? [...list].sort((a, b) => Number(a.negative) - Number(b.negative) || a.rank - b.rank).slice(0, MAX_TILES)
  : list);

/** His picks as tiles. The rank names the competition only when they differ. */
export function highlightStats(list: MoroccanHighlight[]): SpotlightStat[] {
  const oneCompetition = list.every((h) => h.competitionId === list[0].competitionId);
  return list.map((h) => ({
    key: h.key,
    value: h.value,
    label: h.category,
    note: oneCompetition ? (h.rank <= ORDINALS.length ? `المركز ${ordinal(h.rank)}` : ordinal(h.rank)) : `${ordinal(h.rank)} في ${h.competition}`,
    logo: oneCompetition ? null : h.competitionLogo,
  }));
}

/**
 * Moroccan players' standout statistics: a roundup of several players, or one
 * player's own poster, however many of his statistics are picked. Every size
 * and position comes from MoroccanLayout.
 */
const MoroccanPoster = forwardRef<HTMLDivElement, Props>(function MoroccanPoster({ highlights: picks, layout, templateSrc }, ref) {
  const L = layout;
  const highlights = posterHighlights(picks);
  const solo = onePlayer(highlights) ? highlights[0] : null;
  const R = L.roundup;
  // However many are picked, they end above lastRowY: the pitch shrinks, and
  // everything inside a row with it.
  const pitch = highlights.length > 1 ? Math.min(R.rowHeight, (R.lastRowY - R.firstRowY) / (highlights.length - 1)) : R.rowHeight;
  const k = pitch / R.rowHeight;

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
        <div style={{ ...centred(L.title.x, L.title.y), fontSize: L.title.fontSize, fontWeight: 900, color: L.title.color }}>{L.title.text || "المغاربة في الصدارة"}</div>
      )}
      {!solo && L.subtitle.show && (
        <div style={{ ...centred(L.subtitle.x, L.subtitle.y), fontSize: L.subtitle.fontSize, fontWeight: 700, color: L.subtitle.color }}>{L.subtitle.text || "إحصائيات الموسم"}</div>
      )}

      {solo ? (
        <PlayerSpotlight
          width={L.width} layout={L.player} photo={solo.photo} clubLogo={solo.clubLogo} name={solo.name}
          title={L.title.show ? (L.title.text && L.title.text !== DEFAULT_MOROCCAN_LAYOUT.title.text ? L.title.text : "إحصائيات الموسم") : null}
          subtitle={L.subtitle.show ? L.subtitle.text || (highlights.every((h) => h.competitionId === solo.competitionId) ? solo.competition : null) : null}
          stats={highlightStats(highlights)}
        />
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
