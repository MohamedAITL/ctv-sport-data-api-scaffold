import { forwardRef, type CSSProperties } from "react";
import type { Match } from "@/types/fixtures";
import type { MatchdayLayout } from "@/config/matchdayLayout";
import { BOTOLA_LEAGUE_ID, leagueArName } from "@/config/featuredLeagues";

interface Props {
  matches: Match[];
  layout: MatchdayLayout;
  templateSrc: string | null;
  nameOverrides: Record<string, string>;
  logoOverrides: Record<string, string>;
}

const badgeStyle = (x: number, y: number, size: number): CSSProperties => ({
  position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)",
  width: size, height: size, objectFit: "contain",
});

interface Group { leagueId: string; leagueName: string; leagueLogo: string | null; matches: Match[]; maxFame: number; popularity: number }

// Group selected matches by competition. Botola first, then by biggest match
// (fame), then popularity. Matches inside a group are ordered by kickoff.
function groupByLeague(matches: Match[]): Group[] {
  const map = new Map<string, Group>();
  for (const m of matches) {
    let g = map.get(m.leagueId);
    if (!g) {
      g = { leagueId: m.leagueId, leagueName: m.leagueName, leagueLogo: m.leagueLogo, matches: [], maxFame: 0, popularity: m.leaguePopularity };
      map.set(m.leagueId, g);
    }
    g.matches.push(m);
    g.maxFame = Math.max(g.maxFame, m.fame);
  }
  const groups = Array.from(map.values());
  groups.forEach((g) => g.matches.sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc)));
  return groups.sort((a, b) => {
    if (a.leagueId === BOTOLA_LEAGUE_ID) return -1;
    if (b.leagueId === BOTOLA_LEAGUE_ID) return 1;
    return b.maxFame - a.maxFame || b.popularity - a.popularity;
  });
}

const MatchdayPoster = forwardRef<HTMLDivElement, Props>(function MatchdayPoster(
  { matches, layout, templateSrc, nameOverrides, logoOverrides },
  ref
) {
  const L = layout;
  const arName = (id: string, fallback: string) => nameOverrides[id] || fallback;
  const badgeOf = (id: string, fallback: string | null) => logoOverrides[id] || fallback;
  const groups = groupByLeague(matches);

  // Auto-fit: scale spacing so all groups + rows fit within the canvas height.
  const headerCount = L.groupHeader.show ? groups.length : 0;
  const bottomMargin = 46;
  const avail = L.height - L.firstRowCenterY + L.rowHeight / 2 - bottomMargin;
  const needed = headerCount * L.groupHeader.height + matches.length * L.rowHeight + groups.length * L.groupGap;
  const fit = needed > avail && needed > 0 ? avail / needed : 1;
  const rowH = L.rowHeight * fit;
  const headH = L.groupHeader.height * fit;
  const gap = L.groupGap * fit;
  const cardH = L.rowBg.height * fit;

  // Lay out headers + rows top-to-bottom with a running y cursor.
  const nodes: React.ReactNode[] = [];
  const headerNodes: React.ReactNode[] = [];
  let y = L.firstRowCenterY;

  for (const g of groups) {
    if (L.groupHeader.show) {
      headerNodes.push(
        <div key={"h-" + g.leagueId} style={{ position: "absolute", left: L.rowBg.insetX, width: L.width - 2 * L.rowBg.insetX, top: y, transform: "translateY(-50%)", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, direction: "rtl" }}>
          {g.leagueLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={g.leagueLogo} alt="" width={L.groupHeader.logoSize} height={L.groupHeader.logoSize} style={{ width: L.groupHeader.logoSize, height: L.groupHeader.logoSize, objectFit: "contain" }} />
          )}
          <span style={{ color: L.groupHeader.color, fontSize: L.groupHeader.fontSize, fontWeight: 800 }}>{leagueArName(g.leagueId, g.leagueName)}</span>
        </div>
      );
      y += headH;
    }

    for (const m of g.matches) {
      const rowY = y;
      const homeBadge = badgeOf(m.home.id, m.home.badge);
      const awayBadge = badgeOf(m.away.id, m.away.badge);
      nodes.push(
        <div key={m.id}>
          {L.rowBg.show && (
            <div style={{ position: "absolute", left: L.rowBg.insetX, top: rowY, width: L.width - 2 * L.rowBg.insetX, height: cardH, transform: "translateY(-50%)", background: L.rowBg.color, opacity: L.rowBg.opacity, borderRadius: L.rowBg.radius }} />
          )}
          {homeBadge ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={homeBadge} alt="" style={badgeStyle(L.homeBadgeX, rowY, L.badgeSize)} />
          ) : (
            <div style={{ ...badgeStyle(L.homeBadgeX, rowY, L.badgeSize), display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#4b3a6e", color: "#fff", fontWeight: 800 }}>{(m.home.name || "?").charAt(0)}</div>
          )}
          <div style={{ position: "absolute", top: rowY, right: L.width - L.homeNameRightX, transform: "translateY(-50%)", direction: "rtl", textAlign: "right", color: L.nameColor, fontSize: L.nameFontSize, fontWeight: 700, whiteSpace: "nowrap", maxWidth: L.nameMaxWidth, overflow: "hidden", textOverflow: "ellipsis" }}>
            {arName(m.home.id, m.home.nameAr)}
          </div>

          <div style={{ position: "absolute", left: L.centerX, top: rowY, transform: "translate(-50%, -50%)", direction: "ltr", textAlign: "center", color: L.centerColor, fontSize: L.centerFontSize, fontWeight: 800, whiteSpace: "nowrap" }}>
            {m.statusLabel}
          </div>

          {awayBadge ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={awayBadge} alt="" style={badgeStyle(L.awayBadgeX, rowY, L.badgeSize)} />
          ) : (
            <div style={{ ...badgeStyle(L.awayBadgeX, rowY, L.badgeSize), display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#4b3a6e", color: "#fff", fontWeight: 800 }}>{(m.away.name || "?").charAt(0)}</div>
          )}
          <div style={{ position: "absolute", top: rowY, left: L.awayNameLeftX, transform: "translateY(-50%)", direction: "rtl", textAlign: "left", color: L.nameColor, fontSize: L.nameFontSize, fontWeight: 700, whiteSpace: "nowrap", maxWidth: L.nameMaxWidth, overflow: "hidden", textOverflow: "ellipsis" }}>
            {arName(m.away.id, m.away.nameAr)}
          </div>
        </div>
      );
      y += rowH;
    }
    y += gap;
  }

  return (
    <div
      ref={ref}
      style={{
        position: "relative", width: L.width, height: L.height, overflow: "hidden",
        fontFamily: "Cairo, sans-serif",
        background: templateSrc ? "#2b1a45" : "linear-gradient(160deg,#3a1d55 0%,#2a1340 55%,#45205f 100%)",
      }}
    >
      {templateSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={templateSrc} alt="" width={L.width} height={L.height} style={{ position: "absolute", inset: 0, width: L.width, height: L.height, objectFit: "cover" }} />
      )}
      {L.title.show && (
        <div style={{ position: "absolute", left: L.title.x, top: L.title.y, transform: "translate(-50%, -50%)", direction: "rtl", color: L.title.color, fontSize: L.title.fontSize, fontWeight: 900, whiteSpace: "nowrap" }}>{L.title.text}</div>
      )}
      {L.dateLabel.show && L.dateLabel.text && (
        <div style={{ position: "absolute", left: L.dateLabel.x, top: L.dateLabel.y, transform: "translate(-50%, -50%)", direction: "rtl", color: L.dateLabel.color, fontSize: L.dateLabel.fontSize, fontWeight: 700, whiteSpace: "nowrap" }}>{L.dateLabel.text}</div>
      )}
      {nodes}
      {headerNodes}
    </div>
  );
});

export default MatchdayPoster;
