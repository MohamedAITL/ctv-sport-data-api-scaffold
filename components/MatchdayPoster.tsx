import { forwardRef, type CSSProperties } from "react";
import type { Match } from "@/types/fixtures";
import type { MatchdayLayout } from "@/config/matchdayLayout";

interface Props {
  matches: Match[];
  layout: MatchdayLayout;
  templateSrc: string | null;
  nameOverrides: Record<string, string>;
  logoOverrides: Record<string, string>;
}

const badgeStyle = (x: number, y: number, size: number): CSSProperties => ({
  position: "absolute",
  left: x,
  top: y,
  transform: "translate(-50%, -50%)",
  width: size,
  height: size,
  objectFit: "contain",
});

const MatchdayPoster = forwardRef<HTMLDivElement, Props>(function MatchdayPoster(
  { matches, layout, templateSrc, nameOverrides, logoOverrides },
  ref
) {
  const L = layout;
  const arName = (id: string, fallback: string) => nameOverrides[id] || fallback;
  const badgeOf = (id: string, fallback: string | null) => logoOverrides[id] || fallback;

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
        <div style={{ position: "absolute", left: L.title.x, top: L.title.y, transform: "translate(-50%, -50%)", direction: "rtl", color: L.title.color, fontSize: L.title.fontSize, fontWeight: 900, whiteSpace: "nowrap" }}>
          {L.title.text}
        </div>
      )}
      {L.dateLabel.show && L.dateLabel.text && (
        <div style={{ position: "absolute", left: L.dateLabel.x, top: L.dateLabel.y, transform: "translate(-50%, -50%)", direction: "rtl", color: L.dateLabel.color, fontSize: L.dateLabel.fontSize, fontWeight: 700, whiteSpace: "nowrap" }}>
          {L.dateLabel.text}
        </div>
      )}

      {matches.map((m, i) => {
        const y = L.firstRowCenterY + i * L.rowHeight;
        const homeBadge = badgeOf(m.home.id, m.home.badge);
        const awayBadge = badgeOf(m.away.id, m.away.badge);
        return (
          <div key={m.id || i}>
            {L.rowBg.show && (
              <div style={{ position: "absolute", left: L.rowBg.insetX, top: y, width: L.width - 2 * L.rowBg.insetX, height: L.rowBg.height, transform: "translateY(-50%)", background: L.rowBg.color, opacity: L.rowBg.opacity, borderRadius: L.rowBg.radius }} />
            )}

            {/* home (right) */}
            {homeBadge ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={homeBadge} alt="" style={badgeStyle(L.homeBadgeX, y, L.badgeSize)} />
            ) : (
              <div style={{ ...badgeStyle(L.homeBadgeX, y, L.badgeSize), display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#4b3a6e", color: "#fff", fontWeight: 800 }}>{(m.home.name || "?").charAt(0)}</div>
            )}
            <div style={{ position: "absolute", top: y, right: L.width - L.homeNameRightX, transform: "translateY(-50%)", direction: "rtl", textAlign: "right", color: L.nameColor, fontSize: L.nameFontSize, fontWeight: 700, whiteSpace: "nowrap", maxWidth: L.nameMaxWidth, overflow: "hidden", textOverflow: "ellipsis" }}>
              {arName(m.home.id, m.home.nameAr)}
            </div>

            {/* centre: league logo + time/score */}
            {L.leagueLogo.show && m.leagueLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.leagueLogo} alt="" style={badgeStyle(L.centerX, y + L.leagueLogo.dy, L.leagueLogo.size)} />
            )}
            <div style={{ position: "absolute", left: L.centerX, top: y + (L.leagueLogo.show ? 8 : 0), transform: "translate(-50%, -50%)", direction: "ltr", textAlign: "center", color: L.centerColor, fontSize: L.centerFontSize, fontWeight: 800, whiteSpace: "nowrap" }}>
              {m.statusLabel}
            </div>

            {/* away (left) */}
            {awayBadge ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={awayBadge} alt="" style={badgeStyle(L.awayBadgeX, y, L.badgeSize)} />
            ) : (
              <div style={{ ...badgeStyle(L.awayBadgeX, y, L.badgeSize), display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#4b3a6e", color: "#fff", fontWeight: 800 }}>{(m.away.name || "?").charAt(0)}</div>
            )}
            <div style={{ position: "absolute", top: y, left: L.awayNameLeftX, transform: "translateY(-50%)", direction: "rtl", textAlign: "left", color: L.nameColor, fontSize: L.nameFontSize, fontWeight: 700, whiteSpace: "nowrap", maxWidth: L.nameMaxWidth, overflow: "hidden", textOverflow: "ellipsis" }}>
              {arName(m.away.id, m.away.nameAr)}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default MatchdayPoster;
