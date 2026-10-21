import { useEffect, useState } from "react";
import LineupPoster from "./LineupPoster";
import LineupDesign from "./LineupDesign";
import PosterExport from "./PosterExport";
import { DEFAULT_LINEUP_LAYOUT, type LineupLayout } from "@/config/lineupLayout";
import type { LiveDetail, LiveMatch } from "@/types/live";

/**
 * Exports both starting XIs as a 1080x1350 poster. Opens with its own fetch of
 * the match, `inline=1`, which comes back with the crests and the 22 faces as
 * data URLs — html-to-image cannot read the CDN's pixels, and the kiosk's 15s
 * poll should not carry ~500KB of photos for an export nobody may run.
 */
export default function LineupExport({ match, onClose }: { match: LiveMatch; onClose: () => void }) {
  const [d, setD] = useState<LiveDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  }, [match]);

  return (
    <PosterExport<LineupLayout>
      title="ملصق التشكيلة"
      layoutKey="botola.lineupLayout"
      templateKey="lineup"
      defaults={DEFAULT_LINEUP_LAYOUT}
      fileBase={`choufsport-lineups-${match.home.id}-${match.away.id}`}
      ready={Boolean(d)}
      error={error}
      onClose={onClose}
      poster={(ref, l, tpl) => d?.homeLineup && d.awayLineup && (
        <LineupPoster ref={ref} match={d.match} home={d.homeLineup} away={d.awayLineup} layout={l} templateSrc={tpl} />
      )}
      design={(l, set) => <LineupDesign layout={l} onChange={set} />}
    />
  );
}
