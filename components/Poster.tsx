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

  // A long table (20-team leagues, 36-team UCL league phase) is split into two
  // side-by-side columns rather than squeezed into one, so every row keeps a
  // readable size. Botola's 16 rows stay in one column, unchanged.
  const cols =
    T.columns === "auto" ? (total > T.twoColFrom ? 2 : 1) : T.columns;
  const perCol = Math.ceil(total / cols);

  // Auto-fit is the safety net for whatever a column still can't hold, but it
  // never shrinks the name below `minFontSize` — unreadable is worse than tight.
  const avail = T.bottomY - T.firstRowCenterY;
  const needed = Math.max(0, perCol - 1) * T.rowHeight;
  const rawFit = needed > avail && needed > 0 ? avail / needed : 1;
  const colScale = cols === 2 ? T.twoColScale : 1;
  const fit = Math.max(rawFit, T.minFontSize / Math.max(1, T.fontSizeName * colScale));

  const rowHeight = T.rowHeight * Math.min(rawFit, fit);
  const logoSize = T.logoSize * fit * colScale;
  const fsName = T.fontSizeName * fit * colScale;
  const fsStat = T.fontSizeStat * fit * colScale;
  const fsRank = T.fontSizeRank * fit * colScale;

  // Remap a full-width x anchor into column `c` (0 = right-hand column, RTL).
  const span = Math.max(1, T.spanRight - T.spanLeft);
  const colWidth = cols === 2 ? (span - T.columnGap) / 2 : span;
  const xIn = (x: number, c: number) => {
    if (cols === 1) return x;
    const start = c === 0 ? T.spanRight - colWidth : T.spanLeft;
    return start + ((x - T.spanLeft) / span) * colWidth;
  };

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
      {L.columnHeaders.show &&
        Array.from({ length: cols }, (_, c) => {
          const hs = { direction: "rtl" as const, color: L.columnHeaders.color, fontSize: L.columnHeaders.fontSize * colScale, fontWeight: 700 };
          return (
            <div key={"ch" + c}>
              <div style={{ ...centered(xIn(T.pointsX, c), L.columnHeaders.y), ...hs }}>نقاط</div>
              <div style={{ ...centered(xIn(T.winsX, c), L.columnHeaders.y), ...hs }}>فوز</div>
              <div style={{ ...centered(xIn(T.playedX, c), L.columnHeaders.y), ...hs }}>لعب</div>
            </div>
          );
        })}

      {/* Rows */}
      {rows.map((r, i) => {
        const c = Math.floor(i / perCol);
        const y = T.firstRowCenterY + (i % perCol) * rowHeight;
        const zc = zoneColor(r.rank, total, L.zones);
        const logo = logoOverrides[r.teamId] || r.logo;
        const logoX = xIn(T.logoCenterX, c);
        const nameRight = L.width - xIn(T.nameRightX, c);
        const nameMax = Math.max(60, colWidth * 0.52);
        return (
          <div key={r.teamId || i}>
            <div style={{ ...centered(xIn(T.rankX, c), y), color: zc, fontSize: fsRank, fontWeight: 800 }}>{r.rank}</div>

            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                width={logoSize}
                height={logoSize}
                style={{ position: "absolute", left: logoX, top: y, transform: "translate(-50%, -50%)", width: logoSize, height: logoSize, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{ position: "absolute", left: logoX, top: y, transform: "translate(-50%, -50%)", width: logoSize, height: logoSize, borderRadius: "50%", background: "#4b3a6e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: logoSize * 0.42, fontWeight: 800 }}
              >
                {(r.nameOriginal || "?").trim().charAt(0).toUpperCase()}
              </div>
            )}

            <div
              style={{ position: "absolute", top: y, right: nameRight, transform: "translateY(-50%)", direction: "rtl", textAlign: "right", color: T.nameColor, fontSize: fsName, fontWeight: 700, whiteSpace: "nowrap", maxWidth: nameMax, overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {r.nameAr}
            </div>

            <div style={{ ...centered(xIn(T.playedX, c), y), color: "#ffffff", fontSize: fsStat, fontWeight: 800 }}>{r.played}</div>
            <div style={{ ...centered(xIn(T.winsX, c), y), color: "#ffffff", fontSize: fsStat, fontWeight: 800 }}>{r.wins}</div>
            <div style={{ ...centered(xIn(T.pointsX, c), y), color: zc, fontSize: fsStat, fontWeight: 800 }}>{r.points}</div>
          </div>
        );
      })}
    </div>
  );
});

export default Poster;
