import { forwardRef, type CSSProperties } from "react";
import type { StatRow } from "@/lib/scores365Stats";
import type { StatsLayout } from "@/config/statsLayout";

interface Props {
  title: string;
  subtitle: string;
  rows: StatRow[];
  layout: StatsLayout;
  templateSrc: string | null;
  kind: "player" | "team";
}

// Ranked leaderboard poster (top scorers, cards, team stats...), 1080x1350.
// Same export-node contract as the standings poster: fixed size, template at the
// bottom, everything drawn on top, captured as one composition.
const StatsPoster = forwardRef<HTMLDivElement, Props>(function StatsPoster(
  { title, subtitle, rows, layout, templateSrc, kind },
  ref
) {
  const L = layout;
  const shown = rows.slice(0, L.topN);

  // Shrink only if the chosen row count cannot fit; never below readable size.
  const avail = L.bottomY - L.firstRowCenterY;
  const needed = Math.max(0, shown.length - 1) * L.rowHeight;
  const fit = needed > avail && needed > 0 ? avail / needed : 1;
  const rowH = L.rowHeight * fit;
  const photo = L.photoSize * fit;
  const fsName = Math.max(L.minFontSize, L.nameFontSize * fit);
  const fsValue = L.valueFontSize * fit;
  const fsRank = L.rankFontSize * fit;
  const fsSecond = L.secondaryFontSize * fit;

  const centred = (x: number, y: number): CSSProperties => ({
    position: "absolute",
    left: x,
    top: y,
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    whiteSpace: "nowrap",
  });

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: L.width,
        height: L.height,
        overflow: "hidden",
        fontFamily: "Cairo, sans-serif",
        background: templateSrc ? "#2b1a45" : "linear-gradient(160deg,#3a1d55 0%,#2a1340 55%,#45205f 100%)",
      }}
    >
      {templateSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={templateSrc} alt="" width={L.width} height={L.height} style={{ position: "absolute", inset: 0, width: L.width, height: L.height, objectFit: "cover" }} />
      )}

      {L.title.show && (
        <div style={{ ...centred(L.title.x, L.title.y), direction: "rtl", color: L.title.color, fontSize: L.title.fontSize, fontWeight: 900 }}>
          {title}
        </div>
      )}
      {L.subtitle.show && subtitle && (
        <div style={{ ...centred(L.subtitle.x, L.subtitle.y), direction: "rtl", color: L.subtitle.color, fontSize: L.subtitle.fontSize, fontWeight: 700 }}>
          {subtitle}
        </div>
      )}

      {shown.map((r, i) => {
        const y = L.firstRowCenterY + i * rowH;
        const top3 = i < 3;
        return (
          <div key={r.id || i}>
            {L.rowBg.show && (
              <div style={{ position: "absolute", left: L.rowBg.insetX, top: y, width: L.width - 2 * L.rowBg.insetX, height: L.rowBg.height * fit, transform: "translateY(-50%)", background: L.rowBg.color, opacity: top3 ? Math.min(1, L.rowBg.opacity + 0.1) : L.rowBg.opacity, borderRadius: L.rowBg.radius }} />
            )}

            {/* rank, far right (RTL) */}
            <div style={{ ...centred(L.rankX, y), direction: "ltr", color: top3 ? L.topColor : L.rankColor, fontSize: fsRank, fontWeight: 800 }}>{r.rank}</div>

            {/* photo / crest */}
            {r.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.image} alt="" width={photo} height={photo} style={{ position: "absolute", left: L.photoX, top: y, transform: "translate(-50%, -50%)", width: photo, height: photo, borderRadius: "50%", objectFit: "cover", background: "#4b3a6e" }} />
            ) : (
              <div style={{ position: "absolute", left: L.photoX, top: y, transform: "translate(-50%, -50%)", width: photo, height: photo, borderRadius: "50%", background: "#4b3a6e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: photo * 0.4, fontWeight: 800 }}>
                {(r.name || "?").trim().charAt(0)}
              </div>
            )}

            {/* club crest beside a player's photo */}
            {kind === "player" && r.clubImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.clubImage} alt="" width={photo * 0.45} height={photo * 0.45} style={{ position: "absolute", left: L.clubX, top: y + photo * 0.26, transform: "translate(-50%, -50%)", width: photo * 0.45, height: photo * 0.45, objectFit: "contain" }} />
            )}

            {/* name (+ secondary line) right-aligned */}
            <div style={{ position: "absolute", top: r.secondary && L.showSecondary ? y - fsSecond * 0.7 : y, right: L.width - L.nameRightX, transform: "translateY(-50%)", direction: "rtl", textAlign: "right", color: L.nameColor, fontSize: fsName, fontWeight: 700, whiteSpace: "nowrap", maxWidth: L.nameMaxWidth, overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.name}
            </div>
            {r.secondary && L.showSecondary && (
              <div style={{ position: "absolute", top: y + fsName * 0.75, right: L.width - L.nameRightX, transform: "translateY(-50%)", direction: "rtl", textAlign: "right", color: L.secondaryColor, fontSize: fsSecond, fontWeight: 600, whiteSpace: "nowrap", maxWidth: L.nameMaxWidth, overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.secondary}
              </div>
            )}

            {/* value, left */}
            <div style={{ ...centred(L.valueX, y), direction: "ltr", color: top3 ? L.topColor : L.valueColor, fontSize: fsValue, fontWeight: 900 }}>{r.value}</div>
          </div>
        );
      })}
    </div>
  );
});

export default StatsPoster;
