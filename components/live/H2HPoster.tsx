import { forwardRef, type CSSProperties } from "react";
import type { H2HLayout } from "@/config/h2hLayout";
import type { H2HRecord, LiveMatch, PastMatch } from "@/types/live";

interface Props {
  match: LiveMatch;
  meetings: PastMatch[];
  record: H2HRecord;
  layout: H2HLayout;
  templateSrc: string | null;
}

const ar = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const centred = (x: number, y: number): CSSProperties => ({
  position: "absolute", left: x, top: y,
  transform: "translate(-50%, -50%)", textAlign: "center", whiteSpace: "nowrap",
});

function Crest({ src, size, x, y }: { src: string | null; size: number; x: number; y: number }) {
  const box: CSSProperties = {
    position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)",
    width: size, height: size, objectFit: "contain",
  };
  if (!src) return <div style={{ ...box, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" style={box} />;
}

/**
 * The head-to-head poster: both sides, their record, and the last meetings —
 * 1080x1350, the same export contract as the other posters (fixed size,
 * template underneath, everything drawn on top, captured as one composition),
 * and every value driven by H2HLayout so the panel can edit it.
 */
const H2HPoster = forwardRef<HTMLDivElement, Props>(function H2HPoster(
  { match, meetings, record, layout, templateSrc },
  ref
) {
  const L = layout;
  const shown = meetings.slice(0, L.rows);
  // The header badges come from the meetings, whose crests arrive as data URLs
  // — the live match's own URLs point at the CDN and the export canvas cannot
  // read cross-origin pixels.
  const sides = shown.flatMap((m) => [m.home, m.away]);
  const crestOf = (name: string) => sides.find((s) => s.name === name)?.logo ?? null;
  const home = { ...match.home, logo: crestOf(match.home.name) };
  const away = { ...match.away, logo: crestOf(match.away.name) };
  const T = L.teams;
  const R = L.record;

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
          {L.title.text || "المواجهات المباشرة"}
        </div>
      )}
      {L.subtitle.show && (
        <div style={{ ...centred(L.subtitle.x, L.subtitle.y), fontSize: L.subtitle.fontSize, fontWeight: 700, color: L.subtitle.color }}>
          {L.subtitle.text || match.competition}
        </div>
      )}

      {T.show && (
        <>
          <Crest src={home.logo} size={T.crestSize} x={T.nearX} y={T.y} />
          <Crest src={away.logo} size={T.crestSize} x={T.farX} y={T.y} />
          <div style={{ ...centred(T.nearX, T.y + T.nameDy), fontSize: T.nameFontSize, fontWeight: 800, color: T.nameColor, maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis" }}>{home.name}</div>
          <div style={{ ...centred(T.farX, T.y + T.nameDy), fontSize: T.nameFontSize, fontWeight: 800, color: T.nameColor, maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis" }}>{away.name}</div>
          <div style={{ ...centred(L.width / 2, T.y), fontSize: T.vsFontSize, fontWeight: 900, color: T.vsColor, opacity: 0.5 }}>ضد</div>
        </>
      )}

      {R.show && (
        <>
          <div style={{ ...centred(T.nearX, R.y), fontSize: R.fontSize, fontWeight: 900, color: R.color }}>{record.homeWins}</div>
          <div style={{ ...centred(L.width / 2, R.y), fontSize: R.fontSize, fontWeight: 900, color: R.drawColor }}>{record.draws}</div>
          <div style={{ ...centred(T.farX, R.y), fontSize: R.fontSize, fontWeight: 900, color: R.color }}>{record.awayWins}</div>
          {R.drawLabel.show && (
            <div style={{ ...centred(L.width / 2, R.y + R.drawLabel.dy), fontSize: R.drawLabel.fontSize, fontWeight: 800, color: R.drawLabel.color }}>
              {R.drawLabel.text || "تعادل"}
            </div>
          )}
          <div style={{ ...centred(L.width / 2, R.y + R.metaDy), fontSize: R.metaFontSize, fontWeight: 700, color: R.metaColor, opacity: 0.75 }}>
            {record.played} مواجهة · الأهداف{" "}
            {/* Pinned left-to-right and ordered like the crests above it —
                between two numbers an RTL paragraph would flip the pair. */}
            <span style={{ direction: "ltr", display: "inline-block" }}>{record.awayGoals} - {record.homeGoals}</span>
          </div>
        </>
      )}

      {shown.map((m, i) => {
        const y = L.firstRowY + i * L.rowHeight;
        const weHosted = m.home.name === match.home.name;
        const ours = weHosted ? m.home : m.away;
        const theirs = weHosted ? m.away : m.home;
        const name: CSSProperties = {
          position: "absolute", top: y + 12, transform: "translateY(-50%)",
          width: L.rowNameWidth, fontSize: L.rowNameFontSize, fontWeight: 800, color: L.rowNameColor,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        };
        return (
          <div key={m.id}>
            {L.rowBg.show && (
              <div style={{
                position: "absolute", left: L.rowBg.insetX, top: y, transform: "translateY(-50%)",
                width: L.width - 2 * L.rowBg.insetX, height: L.rowBg.height,
                background: L.rowBg.color, opacity: L.rowBg.opacity, borderRadius: L.rowBg.radius,
              }} />
            )}
            {L.rowDate.show && (
              <div style={{ ...centred(L.width / 2, y + L.rowDate.dy), fontSize: L.rowDate.fontSize, fontWeight: 700, color: L.rowDate.color, opacity: 0.7 }}>
                {ar(m.date)} · {m.competition}
              </div>
            )}
            <div style={{ ...name, right: L.width - L.rowNameRight, textAlign: "right" }}>{ours.name}</div>
            <Crest src={ours.logo} size={L.rowCrestSize} x={L.rowCrestNear} y={y + 12} />
            <div style={{ ...centred(L.width / 2, y + 12), fontSize: L.rowScoreFontSize, fontWeight: 900, color: L.rowScoreColor, direction: "ltr" }}>
              {/* Left to right, so the digits must follow the crests: the far
                  side is drawn on the left and our side on the right. */}
              {theirs.score ?? "-"} - {ours.score ?? "-"}
            </div>
            <Crest src={theirs.logo} size={L.rowCrestSize} x={L.rowCrestFar} y={y + 12} />
            <div style={{ ...name, left: L.rowNameLeft, textAlign: "left" }}>{theirs.name}</div>
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

export default H2HPoster;
