import { useEffect, useState } from "react";
import H2HPoster from "./H2HPoster";
import H2HDesign from "./H2HDesign";
import PosterExport from "./PosterExport";
import { DEFAULT_H2H_LAYOUT, type H2HLayout } from "@/config/h2hLayout";
import { h2hRecord } from "@/lib/h2hRecord";
import type { H2HRecord, LiveMatch, PastMatch } from "@/types/live";

/**
 * The meetings on the poster and the record above them — the same meetings:
 * the last `rows` of them, newest first, never the whole history. The poster
 * is about this tie in this competition (a Champions League night is not told
 * by two friendlies); by id, not name — the same competition reads
 * "… - ربع النهائي" once the knockout starts.
 */
export function posterMeetings(all: PastMatch[], match: LiveMatch, l: H2HLayout): { meetings: PastMatch[]; rec: H2HRecord } {
  const pool = l.sameCompetitionOnly ? all.filter((m) => m.competitionId === match.competitionId) : all;
  const meetings = pool.slice(0, l.rows);
  return { meetings, rec: h2hRecord(meetings, match.home.id) };
}

/**
 * Exports the head-to-head as a 1080x1350 poster.
 *
 * The crests have to be data URLs — html-to-image cannot read cross-origin
 * pixels — so the meetings are re-fetched with `inline=1` when this opens,
 * rather than slowing the tab for everyone who never exports.
 */
export default function H2HExport({ match, onClose }: { match: LiveMatch; onClose: () => void }) {
  const [rows, setRows] = useState<PastMatch[] | null>(null);
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
      })
      .catch(() => { if (live) setError("تعذر تجهيز الملصق."); });
    return () => { live = false; };
  }, [match.id, match.matchupId, match.home.id, match.away.id, match.competitionId]);

  const pick = (l: H2HLayout) => posterMeetings(rows ?? [], match, l);

  return (
    <PosterExport<H2HLayout>
      title="ملصق المواجهات المباشرة"
      layoutKey="botola.h2hLayout"
      templateKey="h2h"
      defaults={DEFAULT_H2H_LAYOUT}
      fileBase={`choufsport-h2h-${match.home.id}-${match.away.id}`}
      ready={Boolean(rows)}
      error={error}
      onClose={onClose}
      poster={(ref, l, tpl) => {
        const { meetings, rec } = pick(l);
        return <H2HPoster ref={ref} match={match} meetings={meetings} record={rec} layout={l} templateSrc={tpl} />;
      }}
      design={(l, set) => <H2HDesign layout={l} onChange={set} />}
      note={(l) => pick(l).meetings.length === 0 && (
        <p className="kxp-note">لم يلتق الفريقان من قبل في {match.competition} — أطفئ «هذه المسابقة فقط» لعرض كل المواجهات.</p>
      )}
    />
  );
}
