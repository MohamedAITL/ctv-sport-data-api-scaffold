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
  mode?: "fixtures" | "results";
  /** A matchday spans leagues; a round spans days. */
  groupBy?: "league" | "date";
}

const badgeStyle = (x: number, y: number, size: number): CSSProperties => ({
  position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)",
  width: size, height: size, objectFit: "contain",
});

interface Group { key: string; label: string; logo: string | null; matches: Match[]; maxFame: number; popularity: number }

// "2026-10-17" -> "الجمعة 17 أكتوبر". Rendered in the browser only (the poster
// has no data until the page has fetched), so no SSR locale mismatch.
const arDate = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("ar-MA", { weekday: "long", day: "numeric", month: "long" });
};

// A round is played over two or three days, so its matches are grouped by the
// day they are played, in order.
function groupByDate(matches: Match[]): Group[] {
  const map = new Map<string, Group>();
  for (const m of matches) {
    const key = m.date || "—";
    let g = map.get(key);
    if (!g) {
      g = { key, label: m.date ? arDate(m.date) : "", logo: null, matches: [], maxFame: 0, popularity: 0 };
      map.set(key, g);
    }
    g.matches.push(m);
  }
  const groups = Array.from(map.values());
  groups.forEach((g) => g.matches.sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc)));
  return groups.sort((a, b) => a.key.localeCompare(b.key));
}

// Group selected matches by competition. Botola first, then by biggest match
// (fame), then popularity. Matches inside a group are ordered by kickoff.
function groupByLeague(matches: Match[]): Group[] {
  const map = new Map<string, Group>();
  for (const m of matches) {
    let g = map.get(m.leagueId);
    if (!g) {
      g = { key: m.leagueId, label: leagueArName(m.leagueId, m.leagueName), logo: m.leagueLogo, matches: [], maxFame: 0, popularity: m.leaguePopularity };
      map.set(m.leagueId, g);
    }
    g.matches.push(m);
    g.maxFame = Math.max(g.maxFame, m.fame);
  }
  const groups = Array.from(map.values());
  groups.forEach((g) => g.matches.sort((a, b) => a.kickoffUtc.localeCompare(b.kickoffUtc)));
  return groups.sort((a, b) => {
    if (a.key === BOTOLA_LEAGUE_ID) return -1;
    if (b.key === BOTOLA_LEAGUE_ID) return 1;
    return b.maxFame - a.maxFame || b.popularity - a.popularity;
  });
}

const MatchdayPoster = forwardRef<HTMLDivElement, Props>(function MatchdayPoster(
  { matches, layout, templateSrc, nameOverrides, logoOverrides, mode = "fixtures", groupBy = "league" },
  ref
) {
  const L0 = layout;
  const results = mode === "results";
  const titleCfg = results ? L0.resultsTitle : L0.title;
  const arName = (id: string, fallback: string) => nameOverrides[id] || fallback;
  const badgeOf = (id: string, fallback: string | null) => logoOverrides[id] || fallback;
  const groups = groupBy === "date" ? groupByDate(matches) : groupByLeague(matches);

  // Auto-fit: however many matches are picked, the day fits one 1080x1350
  // poster. Spacing gives way first — the gap between competitions, then rows
  // and headers down to the cards themselves — so crests and names keep their
  // size; only a day too long even then scales everything down together.
  const headers = L0.groupHeader.show ? groups.length : 0;
  const bottomMargin = 46;
  const avail = L0.height - bottomMargin - L0.firstRowCenterY;
  // Space from the first element's centre to the bottom of the last row.
  const need = (r: number, h: number, g: number) =>
    headers * h + matches.length * r + Math.max(groups.length - 1, 0) * g - (headers ? h / 2 : r / 2);
  const rowH0 = L0.rowHeight, headH0 = L0.groupHeader.height;
  const minRow = Math.min(rowH0, (L0.rowBg.show ? L0.rowBg.height : L0.badgeSize) + 4);
  const minHead = Math.min(headH0, Math.max(L0.groupHeader.fontSize * 1.35, L0.groupHeader.logoSize + 4));
  let rowH = rowH0, headH = headH0, gap = L0.groupGap, fit = 1;
  if (!L0.keepSizes && need(rowH0, headH0, gap) > avail) {
    fit = avail / need(rowH0, headH0, gap);
    rowH *= fit; headH *= fit; gap *= fit;
  } else if (need(rowH0, headH0, gap) > avail) {
    gap = groups.length > 1 ? Math.max(0, (avail - need(rowH0, headH0, 0)) / (groups.length - 1)) : 0;
    const full = need(rowH0, headH0, 0), tight = need(minRow, minHead, 0);
    if (full > avail) {
      const t = full > tight ? Math.min(1, (full - avail) / (full - tight)) : 1;
      rowH = rowH0 - t * (rowH0 - minRow);
      headH = headH0 - t * (headH0 - minHead);
      if (tight > avail) { fit = avail / tight; rowH = minRow * fit; headH = minHead * fit; }
    }
  }
  const L: MatchdayLayout = fit === 1 ? L0 : {
    ...L0,
    badgeSize: L0.badgeSize * fit,
    nameFontSize: L0.nameFontSize * fit,
    centerFontSize: L0.centerFontSize * fit,
    groupHeader: { ...L0.groupHeader, fontSize: L0.groupHeader.fontSize * fit, logoSize: L0.groupHeader.logoSize * fit },
  };
  const cardH = Math.min(L.rowBg.height * fit, rowH);

  // Centre of each card: kickoff time (Fixtures), or the score (Results).
  // Home sits on the right and away on the left, so the away score goes on the
  // left of the dash and the home score on the right. Unplayed matches keep their
  // kickoff time, dimmed, so a half-finished day is never mistaken for a result.
  const centre = (m: Match, rowY: number) => {
    const base: CSSProperties = { position: "absolute", left: L.centerX, top: rowY, transform: "translate(-50%, -50%)", direction: "ltr", textAlign: "center", color: L.centerColor, fontSize: L.centerFontSize, fontWeight: 800, whiteSpace: "nowrap" };
    const hasScore = (m.isFinished || m.isLive) && m.home.score !== null && m.away.score !== null;
    if (!results || !hasScore) {
      return <div style={{ ...base, opacity: results ? 0.5 : 1 }}>{m.time}</div>;
    }
    const pens = m.home.pen != null && m.away.pen != null;
    return (
      <div style={{ ...base, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span>{m.away.score}</span>
          <span style={{ opacity: 0.6 }}>-</span>
          <span>{m.home.score}</span>
        </div>
        {pens && <div style={{ fontSize: L.centerFontSize * 0.4, fontWeight: 700, opacity: 0.8 }}>({m.away.pen} - {m.home.pen})</div>}
        {m.isLive && !m.isFinished && (
          <div style={{ fontSize: L.centerFontSize * 0.4, fontWeight: 700, color: "#58d08b" }}>{m.statusLabel}</div>
        )}
      </div>
    );
  };

  // Lay out headers + rows top-to-bottom; y is the top edge of the next slot.
  // A header owns its own slot, so it sits midway between the competition
  // above and its first row, never closer to one than the other.
  const nodes: React.ReactNode[] = [];
  const headerNodes: React.ReactNode[] = [];
  let y = L.firstRowCenterY - (headers ? headH / 2 : rowH / 2);

  groups.forEach((g) => {
    if (L.groupHeader.show) {
      const headY = y + headH / 2;
      headerNodes.push(
        <div key={"h-" + g.key} style={{ position: "absolute", left: L.rowBg.insetX, width: L.width - 2 * L.rowBg.insetX, top: headY + L.groupHeader.dy, transform: "translateY(-50%)", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, direction: "rtl" }}>
          {g.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={g.logo} alt="" width={L.groupHeader.logoSize} height={L.groupHeader.logoSize} style={{ width: L.groupHeader.logoSize, height: L.groupHeader.logoSize, objectFit: "contain" }} />
          )}
          <span style={{ color: L.groupHeader.color, fontSize: L.groupHeader.fontSize, fontWeight: 800 }}>{g.label}</span>
        </div>
      );
      y += headH;
    }

    for (const m of g.matches) {
      const rowY = y + rowH / 2;
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

          {centre(m, rowY)}

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
  });

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
      {titleCfg.show && (
        <div style={{ position: "absolute", left: titleCfg.x, top: titleCfg.y, transform: "translate(-50%, -50%)", direction: "rtl", color: titleCfg.color, fontSize: titleCfg.fontSize, fontWeight: 900, whiteSpace: "nowrap" }}>{titleCfg.text}</div>
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
