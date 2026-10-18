import { forwardRef, type CSSProperties } from "react";
import type { TeamRow } from "@/types/standings";
import { type LayoutConfig, zoneColor } from "@/config/defaultLayout";

interface PosterProps {
  rows: TeamRow[];
  layout: LayoutConfig;
  templateSrc: string;
  logoOverrides: Record<string, string>;
}

const centered = (x: number, y: number): CSSProperties => ({
  position: "absolute",
  left: x,
  top: y,
  transform: "translate(-50%, -50%)",
  textAlign: "center",
  direction: "ltr",
  whiteSpace: "nowrap",
});

// The exact 1080x1350 export node. Base template is the bottom layer; a mask
// covers the old rows; new rows are drawn on top. Captured as-is by html-to-image.
const Poster = forwardRef<HTMLDivElement, PosterProps>(function Poster(
  { rows, layout, templateSrc, logoOverrides },
  ref
) {
  const L = layout;
  const T = L.table;
  const total = rows.length;

  // Auto-fit: compress the row grid so any table (16 Botola rows up to 36 UCL
  // league-phase rows) fits between the first row and the footer. Scaling row
  // spacing, logo and fonts together keeps proportions and avoids overlap. For a
  // table that already fits (<=16 rows) fit is 1, so Botola is unchanged.
  const bottomY = L.height - 120;
  const avail = bottomY - T.firstRowCenterY;
  const needed = Math.max(0, total - 1) * T.rowHeight;
  const fit = needed > avail && needed > 0 ? avail / needed : 1;
  const rowHeight = T.rowHeight * fit;
  const logoSize = T.logoSize * fit;
  const fsName = T.fontSizeName * fit;
  const fsStat = T.fontSizeStat * fit;
  const fsRank = T.fontSizeRank * fit;

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: L.width,
        height: L.height,
        overflow: "hidden",
        background: "#2b1a45",
        fontFamily: "Cairo, sans-serif",
      }}
    >
      {templateSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={templateSrc}
          alt=""
          width={L.width}
          height={L.height}
          style={{ position: "absolute", inset: 0, width: L.width, height: L.height, objectFit: "cover" }}
        />
      )}

      {/* Mask over the outdated rows, reconstructing the panel interior. */}
      <div
        style={{
          position: "absolute",
          left: L.mask.x,
          top: L.mask.y,
          width: L.mask.w,
          height: L.mask.h,
          background: L.mask.color,
          opacity: L.mask.opacity,
          borderRadius: L.mask.radius, display: L.mask.show ? "block" : "none",
        }}
      />

      {/* Optional static-text overlays (off by default; template keeps them). */}
      {L.heading.show && (
        <div style={{ ...centered(L.heading.x, L.heading.y), direction: "rtl", color: L.heading.color, fontSize: L.heading.fontSize, fontWeight: 900 }}>
          {L.heading.text}
        </div>
      )}
      {L.seasonLabel.show && (
        <div style={{ ...centered(L.seasonLabel.x, L.seasonLabel.y), direction: "rtl", color: L.seasonLabel.color, fontSize: L.seasonLabel.fontSize, fontWeight: 700 }}>
          {L.seasonLabel.text}
        </div>
      )}
      {L.updatedLabel.show && L.updatedLabel.text && (
        <div style={{ ...centered(L.updatedLabel.x, L.updatedLabel.y), direction: "rtl", color: L.updatedLabel.color, fontSize: L.updatedLabel.fontSize, fontWeight: 700 }}>
          {L.updatedLabel.text}
        </div>
      )}
      {L.columnHeaders.show && (
        <>
          <div style={{ ...centered(T.pointsX, L.columnHeaders.y), direction: "rtl", color: L.columnHeaders.color, fontSize: L.columnHeaders.fontSize, fontWeight: 700 }}>نقاط</div>
          <div style={{ ...centered(T.winsX, L.columnHeaders.y), direction: "rtl", color: L.columnHeaders.color, fontSize: L.columnHeaders.fontSize, fontWeight: 700 }}>فوز</div>
          <div style={{ ...centered(T.playedX, L.columnHeaders.y), direction: "rtl", color: L.columnHeaders.color, fontSize: L.columnHeaders.fontSize, fontWeight: 700 }}>لعب</div>
        </>
      )}

      {/* Rows */}
      {rows.map((r, i) => {
        const y = T.firstRowCenterY + i * rowHeight;
        const zc = zoneColor(r.rank, total, L.zones);
        const logo = logoOverrides[r.teamId] || r.logo;
        return (
          <div key={r.teamId || i}>
            <div style={{ ...centered(T.rankX, y), color: zc, fontSize: fsRank, fontWeight: 800 }}>{r.rank}</div>

            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                width={logoSize}
                height={logoSize}
                style={{ position: "absolute", left: T.logoCenterX, top: y, transform: "translate(-50%, -50%)", width: logoSize, height: logoSize, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{ position: "absolute", left: T.logoCenterX, top: y, transform: "translate(-50%, -50%)", width: logoSize, height: logoSize, borderRadius: "50%", background: "#4b3a6e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: logoSize * 0.42, fontWeight: 800 }}
              >
                {(r.nameOriginal || "?").trim().charAt(0).toUpperCase()}
              </div>
            )}

            <div
              style={{ position: "absolute", top: y, right: L.width - T.nameRightX, transform: "translateY(-50%)", direction: "rtl", textAlign: "right", color: T.nameColor, fontSize: fsName, fontWeight: 700, whiteSpace: "nowrap" }}
            >
              {r.nameAr}
            </div>

            <div style={{ ...centered(T.playedX, y), color: "#ffffff", fontSize: fsStat, fontWeight: 800 }}>{r.played}</div>
            <div style={{ ...centered(T.winsX, y), color: "#ffffff", fontSize: fsStat, fontWeight: 800 }}>{r.wins}</div>
            <div style={{ ...centered(T.pointsX, y), color: zc, fontSize: fsStat, fontWeight: 800 }}>{r.points}</div>
          </div>
        );
      })}
    </div>
  );
});

export default Poster;
