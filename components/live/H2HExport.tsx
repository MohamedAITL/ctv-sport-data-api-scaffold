import { useEffect, useState } from "react";
import H2HPoster from "./H2HPoster";
import H2HDesign from "./H2HDesign";
import PosterExport from "./PosterExport";
import { DEFAULT_H2H_LAYOUT, type H2HLayout } from "@/config/h2hLayout";
import { h2hRecord } from "@/lib/h2hRecord";
import type { H2HRecord, LiveMatch, PastMatch } from "@/types/live";

/**
 * Exports the head-to-head as a 1080x1350 poster.
 *
 * The crests have to be data URLs — html-to-image cannot read cross-origin
 * pixels — so the meetings are re-fetched with `inline=1` when this opens,
 * rather than slowing the tab for everyone who never exports.
 */
export default function H2HExport({ match, onClose }: { match: LiveMatch; onClose: () => void }) {
  const [rows, setRows] = useState<PastMatch[] | null>(null);
  const [record, setRecord] = useState<H2HRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const url = `/api/live/previous?game=${match.id}&matchup=${encodeURIComponent(match.matchupId)}`
      + `&home=${match.home.id}&away=${match.away.id}&competition=${match.competitionId}&inline=1`;
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        if (!j.previous?.h2h?.length) { setError("لا توجد مواجهات سابقة لتصديرها."); return; }
        setRows(j.previous.h2h);
        setRecord(j.previous.record);
      })
      .catch(() => { if (live) setError("تعذر تجهيز الملصق."); });
    return () => { live = false; };
  }, [match]);

  // The poster is about this tie in this competition: a Champions League night
  // is not told by two friendlies. The id, not the name — the same competition
  // reads "… - ربع النهائي" once the knockout starts.
  const pick = (l: H2HLayout) => {
    const all = rows ?? [];
    if (!l.sameCompetitionOnly) return { meetings: all, rec: record };
    const meetings = all.filter((m) => m.competitionId === match.competitionId);
    return { meetings, rec: h2hRecord(meetings, match.home.name) };
  };

  return (
    <PosterExport<H2HLayout>
      title="ملصق المواجهات المباشرة"
      layoutKey="botola.h2hLayout"
      templateKey="h2h"
      defaults={DEFAULT_H2H_LAYOUT}
      fileBase={`choufsport-h2h-${match.home.id}-${match.away.id}`}
      ready={Boolean(rows && record)}
      error={error}
      onClose={onClose}
      poster={(ref, l, tpl) => {
        const { meetings, rec } = pick(l);
        return rec && <H2HPoster ref={ref} match={match} meetings={meetings} record={rec} layout={l} templateSrc={tpl} />;
      }}
      design={(l, set) => <H2HDesign layout={l} onChange={set} />}
      note={(l) => pick(l).meetings.length === 0 && (
        <p className="kxp-note">لم يلتق الفريقان من قبل في {match.competition} — أطفئ «هذه المسابقة فقط» لعرض كل المواجهات.</p>
      )}
    />
  );
}
