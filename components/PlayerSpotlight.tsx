import type { CSSProperties } from "react";
import { centred } from "./live/H2HPoster";
import { fitFont } from "./live/FullTimePoster";
import type { PlayerSpotlightLayout } from "@/config/playerSpotlight";

export interface SpotlightStat { key: string; value: string; label: string; note?: string; logo?: string | null }

/** The most a poster holds as tiles; more stays a list. */
export const MAX_TILES = 6;

/** Tiles per row: one row up to three, then a second. */
export const tileRows = (n: number): number[] => (n === 4 ? [2, 2] : n <= 3 ? [n] : [3, n - 3]);

export function Img({ src, size, x, y, round, ring }: { src: string | null; size: number; x: number; y: number; round?: boolean; ring?: { width: number; color: string } }) {
  const box: CSSProperties = {
    position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", width: size, height: size,
    objectFit: round ? "cover" : "contain", borderRadius: round ? "50%" : undefined,
    background: round ? "#2b1a45" : undefined, boxSizing: "border-box",
    border: ring ? `${ring.width}px solid ${ring.color}` : undefined,
  };
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="" style={box} /> : round ? <div style={box} /> : null;
}

interface Props {
  width: number;
  layout: PlayerSpotlightLayout;
  title: string | null;
  subtitle: string | null;
  photo: string | null;
  clubLogo: string | null;
  name: string;
  chip?: string;
  stats: SpotlightStat[];
}

/** The poster's body for one player. Text shrinks to fit: a figure is never cut. */
export default function PlayerSpotlight({ width, layout: S, title, subtitle, photo, clubLogo, name, chip, stats }: Props) {
  const rows = tileRows(stats.length);
  const area = S.statsBottom - S.statsTop;
  const tileH = Math.min(S.tileMaxHeight, (area - S.tileGap * (rows.length - 1)) / rows.length);
  const tileW = (width - 2 * S.statsInsetX - S.tileGap * (rows[0] - 1)) / rows[0];
  const top = S.statsTop + (area - rows.length * tileH - S.tileGap * (rows.length - 1)) / 2;

  // Long names shrink to a size still readable on a phone, then wrap to a second line.
  const inner = (tileW - 44) * 0.9;
  const labelSize = Math.min(S.labelFontSize, tileH * 0.16);
  const noteSize = Math.min(S.noteFontSize, tileH * 0.125);
  const fitted = (text: string, size: number, floor: number, room = inner) => Math.max(Math.min(size, fitFont(text, size, room)), Math.min(size, floor));

  const place = rows.flatMap((count, r) => Array.from({ length: count }, (_, c) => ({
    right: (width - (count * tileW + (count - 1) * S.tileGap)) / 2 + c * (tileW + S.tileGap),
    top: top + r * (tileH + S.tileGap),
  })));

  return (
    <>
      {title && <div style={{ ...centred(width / 2, S.titleY), fontSize: fitFont(title, S.titleFontSize, width - 440), fontWeight: 900, color: S.titleColor }}>{title}</div>}
      {subtitle && <div style={{ ...centred(width / 2, S.subtitleY), fontSize: S.subtitleFontSize, fontWeight: 700, color: S.subtitleColor }}>{subtitle}</div>}

      <Img src={photo} size={S.faceSize} x={width / 2} y={S.faceY} round ring={{ width: S.ringWidth, color: S.ringColor }} />
      <Img src={clubLogo} size={S.clubSize} x={width / 2 + S.faceSize * 0.37} y={S.faceY + S.faceSize * 0.36} />

      <div style={{ ...centred(width / 2, S.nameY), fontSize: fitFont(name, S.nameFontSize, width - 160), fontWeight: 900, color: S.nameColor }}>{name}</div>
      {chip && (
        <div style={{ ...centred(width / 2, S.chipY), padding: "2px 28px", borderRadius: 14, fontSize: fitFont(chip, S.chipFontSize, width - 220), fontWeight: 800, color: S.chipColor, background: S.chipBg }}>
          {chip}
        </div>
      )}

      {stats.map((s, i) => (
        <div key={s.key} style={{ position: "absolute", right: place[i].right, top: place[i].top, width: tileW, height: tileH }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: S.tileRadius, background: S.tileColor, opacity: S.tileOpacity }} />
          <div style={{ position: "absolute", inset: "0 22px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, textAlign: "center" }}>
            <div style={{ direction: "ltr", lineHeight: 1.05, fontSize: fitFont(s.value, Math.min(S.valueFontSize, tileH * 0.4), inner), fontWeight: 900, color: S.valueColor }}>{s.value}</div>
            <div style={{ lineHeight: 1.2, fontSize: fitted(s.label, labelSize, 25), fontWeight: 800, color: S.labelColor }}>{s.label}</div>
            {s.note && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, lineHeight: 1.2, fontSize: fitted(s.note, noteSize, 20, inner - (s.logo ? 38 : 0)), fontWeight: 700, color: S.noteColor }}>
                {s.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logo} alt="" style={{ width: 28, height: 28, flex: "none", objectFit: "contain" }} />
                )}
                <span>{s.note}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
