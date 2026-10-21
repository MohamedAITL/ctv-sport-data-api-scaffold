import { useEffect, useState } from "react";
import LineupPoster, { type LineupTeams } from "./LineupPoster";
import LineupDesign from "./LineupDesign";
import LineupSwaps, { withSwaps, type Swaps } from "./LineupSwaps";
import PosterExport from "./PosterExport";
import { DEFAULT_LINEUP_LAYOUT, type LineupLayout } from "@/config/lineupLayout";
import type { LiveDetail, LiveMatch } from "@/types/live";

/**
 * Exports the lineups as a 1080x1350 poster — both XIs, or one team alone —
 * with any starter swappable for a substitute first. Opens with its own fetch
 * of the match, `inline=1`, which brings the crests and every face (benches
 * included) as data URLs: html-to-image cannot read the CDN's pixels, and the
 * kiosk's 15s poll should not carry the photos for an export nobody may run.
 */
export default function LineupExport({ match, onClose }: { match: LiveMatch; onClose: () => void }) {
  const [d, setD] = useState<LiveDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState<LineupTeams>("both");
  // Per match, like the pitch's own arrangement: closing the window by
  // mistake must not cost the changes.
  const swapKey = `live.lineupSwaps.${match.id}`;
  const [swaps, setSwaps] = useState<Swaps>({});

  useEffect(() => {
    try { const r = localStorage.getItem(swapKey); if (r) setSwaps(JSON.parse(r)); } catch { /* none saved */ }
  }, [swapKey]);
  const saveSwaps = (next: Swaps) => {
    setSwaps(next);
    try { localStorage.setItem(swapKey, JSON.stringify(next)); } catch { /* private mode */ }
  };

  useEffect(() => {
    let live = true;
    fetch(`/api/live/${match.id}?matchup=${encodeURIComponent(match.matchupId)}&inline=1`)
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        const det: LiveDetail | undefined = j.detail;
        if (!det?.homeLineup?.hasFieldPositions || !det.awayLineup?.hasFieldPositions) {
          setError("لم تُنشر التشكيلتان بعد لهذه المباراة.");
          return;
        }
        setD(det);
      })
      .catch(() => { if (live) setError("تعذر تجهيز الملصق."); });
    return () => { live = false; };
  }, [match.id, match.matchupId]);

  const home = d?.homeLineup ? withSwaps(d.homeLineup, "h", swaps) : null;
  const away = d?.awayLineup ? withSwaps(d.awayLineup, "a", swaps) : null;
  const fileBase = team === "both"
    ? `choufsport-lineups-${match.home.id}-${match.away.id}`
    : `choufsport-lineup-${team === "home" ? match.home.id : match.away.id}`;

  const picker: Array<[LineupTeams, string]> = [["both", "الفريقان"], ["home", match.home.name], ["away", match.away.name]];

  return (
    <PosterExport<LineupLayout>
      title="ملصق التشكيلة"
      // v2: the players grew; a layout saved before that would keep them small.
      layoutKey="botola.lineupLayout.v2"
      templateKey="lineup"
      defaults={DEFAULT_LINEUP_LAYOUT}
      fileBase={fileBase}
      ready={Boolean(d)}
      error={error}
      onClose={onClose}
      poster={(ref, l, tpl) => d && home && away && (
        <LineupPoster ref={ref} match={d.match} home={home} away={away} team={team} layout={l} templateSrc={tpl} />
      )}
      design={(l, set) => <LineupDesign layout={l} onChange={set} />}
      aside={d?.homeLineup && d.awayLineup && (
        <>
          <div className="card">
            <h3>الفريق</h3>
            <div className="kxp-actions kxp-pick">
              {picker.map(([k, name]) => (
                <button key={k} type="button" className={`kxp-btn${team === k ? " on" : ""}`} aria-pressed={team === k} onClick={() => setTeam(k)}>
                  {name}
                </button>
              ))}
            </div>
          </div>
          <details className="card collapsible">
            <summary><h3>تعديل التشكيلة</h3><span className="chev" /></summary>
            <p className="muted">اختر لاعباً من الاحتياط ليأخذ مكان أي لاعب أساسي.</p>
            {team !== "away" && <LineupSwaps title={match.home.name} tag="h" lineup={d.homeLineup} swaps={swaps} onChange={saveSwaps} />}
            {team !== "home" && <LineupSwaps title={match.away.name} tag="a" lineup={d.awayLineup} swaps={swaps} onChange={saveSwaps} />}
            {Object.keys(swaps).length > 0 && (
              <button type="button" className="btn ghost" onClick={() => saveSwaps({})}>إلغاء كل التبديلات</button>
            )}
          </details>
        </>
      )}
    />
  );
}
