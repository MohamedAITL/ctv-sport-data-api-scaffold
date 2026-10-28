import { useEffect, useState } from "react";
import MatchStatsPoster from "./MatchStatsPoster";
import MatchStatsDesign from "./MatchStatsDesign";
import PosterExport from "./PosterExport";
import { DEFAULT_MATCH_STATS_LAYOUT, type MatchStatsLayout } from "@/config/matchStatsLayout";
import type { LiveDetail, LiveMatch, StatRow } from "@/types/live";

// Which statistics go on the poster, by the source's stat id — the same ids on
// every match, so a choice made once carries over. null = the "major" ones.
const PICKS_KEY = "live.statsPosterPicks";
/**
 * Exports the match statistics as a 1080x1350 poster: pick the period and the
 * statistics, then style it like every other poster. Opens with its own
 * `inline=1` fetch so the crests are data URLs html-to-image can read.
 */
export default function MatchStatsExport({ match, onClose }: { match: LiveMatch; onClose: () => void }) {
  const [d, setD] = useState<LiveDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(0);
  const [picks, setPicks] = useState<number[] | null>(null);

  useEffect(() => {
    try { const r = localStorage.getItem(PICKS_KEY); if (r) setPicks(JSON.parse(r)); } catch { /* none saved */ }
  }, []);
  const savePicks = (next: number[] | null) => {
    setPicks(next);
    try {
      if (next) localStorage.setItem(PICKS_KEY, JSON.stringify(next));
      else localStorage.removeItem(PICKS_KEY);
    } catch { /* private mode */ }
  };

  useEffect(() => {
    let live = true;
    fetch(`/api/live/${match.id}?matchup=${encodeURIComponent(match.matchupId)}&inline=1`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        if (!live) return;
        const det: LiveDetail | undefined = j.detail;
        if (!det?.statGroups.length) { setError("لم تُنشر إحصائيات هذه المباراة بعد."); return; }
        setD(det);
      })
      .catch(() => { if (live) setError("تعذر تجهيز الملصق."); });
    return () => { live = false; };
  }, [match.id, match.matchupId]);

  const group = d ? d.statGroups[Math.min(period, d.statGroups.length - 1)] : null;
  const all: StatRow[] = group?.rows ?? [];
  // Some leagues flag only two or three statistics as major: too thin a poster.
  const majors = all.filter((s) => s.isMajor);
  const chosen = new Set(picks ?? (majors.length >= 5 ? majors : all.slice(0, 8)).map((s) => s.id));
  const rows = all.filter((s) => chosen.has(s.id));
  const toggle = (id: number, on: boolean) => {
    const next = new Set(chosen);
    if (on) next.add(id); else next.delete(id);
    savePicks(Array.from(next));
  };

  return (
    <PosterExport<MatchStatsLayout>
      title="ملصق إحصائيات المباراة"
      layoutKey="botola.matchStatsLayout"
      templateKey="matchStats"
      defaults={DEFAULT_MATCH_STATS_LAYOUT}
      fileBase={`choufsport-stats-${match.home.id}-${match.away.id}`}
      ready={Boolean(d)}
      error={error}
      onClose={onClose}
      poster={(ref, l, tpl) => d && group && (
        <MatchStatsPoster ref={ref} match={d.match} rows={rows} period={period === 0 ? null : group.name} layout={l} templateSrc={tpl} />
      )}
      design={(l, set) => <MatchStatsDesign layout={l} onChange={set} />}
      note={() => d && rows.length === 0 && <p className="kxp-note">اختر إحصائية واحدة على الأقل لتظهر على الملصق.</p>}
      aside={d && group && (
        <div className="card">
          {d.statGroups.length > 1 && (
            <>
              <h3>الفترة</h3>
              <div className="kxp-actions kxp-pick">
                {d.statGroups.map((g, i) => (
                  <button key={g.id} type="button" className={`kxp-btn${i === period ? " on" : ""}`} aria-pressed={i === period} onClick={() => setPeriod(i)}>
                    {g.name}
                  </button>
                ))}
              </div>
            </>
          )}
          <h3 style={{ marginTop: d.statGroups.length > 1 ? 16 : 0 }}>الإحصائيات على الملصق ({rows.length})</h3>
          <div className="kxp-actions kxp-pick">
            <button type="button" className={`kxp-btn${picks === null ? " on" : ""}`} onClick={() => savePicks(null)}>الأهم</button>
            <button type="button" className="kxp-btn" onClick={() => savePicks(all.map((s) => s.id))}>الكل</button>
            <button type="button" className="kxp-btn" onClick={() => savePicks([])}>مسح</button>
          </div>
          <div className="kxp-stats">
            {all.map((s) => (
              <label key={s.id} className="field check">
                <input type="checkbox" checked={chosen.has(s.id)} onChange={(e) => toggle(s.id, e.target.checked)} />
                <span>{s.name} <bdi dir="ltr">({s.homeValue || "0"} - {s.awayValue || "0"})</bdi></span>
              </label>
            ))}
          </div>
        </div>
      )}
    />
  );
}
