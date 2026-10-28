import { forwardRef } from "react";
import { Crest, centred } from "./H2HPoster";
import type { MatchStatsLayout } from "@/config/matchStatsLayout";
import type { LiveMatch, StatRow } from "@/types/live";

interface Props {
  match: LiveMatch;
  rows: StatRow[];
  /** The period the figures cover, e.g. "الشوط الأول"; null for the whole match. */
  period: string | null;
  layout: MatchStatsLayout;
  templateSrc: string | null;
}

const num = (v: string) => parseFloat(v.replace(/[^\d.]/g, "")) || 0;

/**
 * The match statistics poster: both sides, the score, and one row per chosen
 * statistic — figures at the sides, a split bar of each side's share between.
 * Home is on the right, as on every other poster.
 */
const MatchStatsPoster = forwardRef<HTMLDivElement, Props>(function MatchStatsPoster(
  { match, rows, period, layout, templateSrc },
  ref
) {
  const L = layout;
  const T = L.teams;
  // However many statistics are picked, they end above lastRowY: the pitch
  // shrinks, and everything inside a row with it.
  const room = L.lastRowY - L.firstRowY;
  const pitch = rows.length > 1 ? Math.min(L.rowHeight, room / (rows.length - 1)) : L.rowHeight;
  const k = pitch / L.rowHeight;
  const hasScore = match.home.score !== null && match.away.score !== null;
  const status = match.isLive ? `${match.statusText}${match.clock ? ` ${match.clock}` : ""}` : match.statusText;
  const subtitle = L.subtitle.text || [match.competition, period].filter(Boolean).join(" · ");

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
          {L.title.text || "إحصائيات المباراة"}
        </div>
      )}
      {L.subtitle.show && subtitle && (
        <div style={{ ...centred(L.subtitle.x, L.subtitle.y), fontSize: L.subtitle.fontSize, fontWeight: 700, color: L.subtitle.color }}>{subtitle}</div>
      )}

      {T.show && (
        <>
          <Crest src={match.home.logo} size={T.crestSize} x={T.nearX} y={T.y} />
          <Crest src={match.away.logo} size={T.crestSize} x={T.farX} y={T.y} />
          <div style={{ ...centred(T.nearX, T.y + T.nameDy), fontSize: T.nameFontSize, fontWeight: 800, color: T.nameColor, maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis" }}>{match.home.name}</div>
          <div style={{ ...centred(T.farX, T.y + T.nameDy), fontSize: T.nameFontSize, fontWeight: 800, color: T.nameColor, maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis" }}>{match.away.name}</div>
          {/* Left to right, following the crests: away on the left, home on the right. */}
          <div style={{ ...centred(L.width / 2, T.y), direction: "ltr", fontSize: T.scoreFontSize, fontWeight: 900, color: T.scoreColor }}>
            {hasScore ? `${match.away.score} - ${match.home.score}` : "-"}
          </div>
          {status && (
            <div style={{ ...centred(L.width / 2, T.y + T.statusDy), fontSize: T.statusFontSize, fontWeight: 700, color: T.statusColor }}>{status}</div>
          )}
        </>
      )}

      {rows.map((s, i) => {
        const y = L.firstRowY + i * pitch;
        const h = num(s.homeValue), a = num(s.awayValue);
        const w = L.bar.halfWidth * 2;
        // The source's own share when it gives one, else the figures themselves.
        const total = s.homePercent + s.awayPercent;
        const homeShare = total > 0 ? s.homePercent / total : h + a > 0 ? h / (h + a) : 0;
        const awayShare = total > 0 ? s.awayPercent / total : h + a > 0 ? a / (h + a) : 0;
        const valueStyle = (x: number, lead: boolean) => ({
          ...centred(x, y), direction: "ltr" as const, fontSize: L.value.fontSize * k, fontWeight: 900,
          color: lead ? L.value.leadColor : L.value.color,
        });
        const barTop = y + L.bar.dy * k;
        const barH = L.bar.height * k;
        return (
          <div key={s.id}>
            {L.rowBg.show && (
              <div style={{
                position: "absolute", left: L.rowBg.insetX, top: y, transform: "translateY(-50%)",
                width: L.width - 2 * L.rowBg.insetX, height: L.rowBg.height * k,
                background: L.rowBg.color, opacity: L.rowBg.opacity, borderRadius: L.rowBg.radius,
              }} />
            )}
            <div style={valueStyle(L.value.nearX, h > a)}>{s.homeValue || "0"}</div>
            <div style={valueStyle(L.value.farX, a > h)}>{s.awayValue || "0"}</div>
            <div style={{ ...centred(L.width / 2, y + L.label.dy * k), fontSize: L.label.fontSize * k, fontWeight: 800, color: L.label.color }}>{s.name}</div>
            {L.bar.show && (
              <div style={{ position: "absolute", left: L.width / 2 - L.bar.halfWidth, top: barTop, width: w, height: barH, transform: "translateY(-50%)", borderRadius: L.bar.radius, background: L.bar.trackColor, overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${awayShare * 100}%`, background: L.bar.awayColor }} />
                <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${homeShare * 100}%`, background: L.bar.homeColor }} />
              </div>
            )}
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

export default MatchStatsPoster;
