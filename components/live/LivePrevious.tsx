import { useEffect, useState } from "react";
import type { LiveDetail, PastMatch, PreviousMatches } from "@/types/live";
import type { TeamRow } from "@/types/standings";

const day = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("ar-MA", { day: "numeric", month: "short", year: "numeric" });
};

// Win / draw / loss for the team whose form this is.
const outcome = (m: PastMatch, team: string): "w" | "d" | "l" | null => {
  if (m.home.score === null || m.away.score === null) return null;
  const isHome = m.home.name === team;
  const [us, them] = isHome ? [m.home.score, m.away.score] : [m.away.score, m.home.score];
  return us > them ? "w" : us < them ? "l" : "d";
};

function Row({ m, team }: { m: PastMatch; team?: string }) {
  const r = team ? outcome(m, team) : null;
  return (
    <li className="kpv-row">
      {r && <i className={`kpv-pill ${r}`}>{r === "w" ? "ف" : r === "l" ? "خ" : "ت"}</i>}
      <span className="kpv-date">{day(m.date)}</span>
      <span className="kpv-team">{m.home.name}</span>
      <b className="kpv-score">{m.home.score ?? "-"} - {m.away.score ?? "-"}</b>
      <span className="kpv-team away">{m.away.name}</span>
      <span className="kpv-comp">{m.competition}</span>
    </li>
  );
}

export default function LivePrevious({ d }: { d: LiveDetail }) {
  const [data, setData] = useState<PreviousMatches | null>(null);
  const [table, setTable] = useState<TeamRow[]>([]);
  const [error, setError] = useState(false);
  const { home, away } = d.match;

  useEffect(() => {
    let live = true;
    setData(null);
    setError(false);
    fetch(`/api/live/previous?game=${d.match.id}&matchup=${encodeURIComponent(d.match.matchupId)}&home=${home.id}&away=${away.id}&competition=${d.match.competitionId}`)
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        if (j.previous) { setData(j.previous); setTable(j.table ?? []); } else setError(true);
      })
      .catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [d.match.id, d.match.matchupId, home.id, away.id, d.match.competitionId]);

  if (error) return <div className="kp-none" dir="rtl"><p>تعذر تحميل المواجهات السابقة</p></div>;
  if (!data) return <div className="kp-none" dir="rtl"><p>جاري التحميل…</p></div>;

  const here = (name: string) => name === home.name || name === away.name;
  const empty = data.h2h.length === 0 && data.home.length === 0 && data.away.length === 0 && table.length === 0;
  if (empty) {
    return (
      <div className="kp-none" dir="rtl">
        <p>لا توجد مباريات سابقة</p>
        <span>لا ينشر المصدر نتائج سابقة لهذين الفريقين</span>
      </div>
    );
  }

  return (
    <div className="kpv" dir="rtl">
      {data.h2h.length > 0 && (
        <section>
          <h3>المواجهات المباشرة</h3>
          {data.record.played > 0 && (
            <div className="kh2h">
              <div className="kh2h-side">
                <b>{data.record.homeWins}</b>
                <span>{home.name}</span>
              </div>
              <div className="kh2h-side draw">
                <b>{data.record.draws}</b>
                <span>تعادل</span>
              </div>
              <div className="kh2h-side">
                <b>{data.record.awayWins}</b>
                <span>{away.name}</span>
              </div>
              <p className="kh2h-meta">
                {data.record.played} مواجهة · الأهداف {data.record.homeGoals} - {data.record.awayGoals}
              </p>
            </div>
          )}
          <ul>{data.h2h.map((m) => <Row key={m.id} m={m} team={home.name} />)}</ul>
        </section>
      )}
      {data.home.length > 0 && (
        <section>
          <h3>آخر مباريات {home.name}</h3>
          <ul>{data.home.map((m) => <Row key={m.id} m={m} team={home.name} />)}</ul>
        </section>
      )}
      {data.away.length > 0 && (
        <section>
          <h3>آخر مباريات {away.name}</h3>
          <ul>{data.away.map((m) => <Row key={m.id} m={m} team={away.name} />)}</ul>
        </section>
      )}
      {table.length > 0 && (
        <section>
          <h3>{d.match.competition} — الترتيب</h3>
          <table className="kpt">
            <thead>
              <tr><th>#</th><th>الفريق</th><th>لعب</th><th>فاز</th><th>تعادل</th><th>خسر</th><th>نقاط</th></tr>
            </thead>
            <tbody>
              {table.map((r) => (
                <tr key={r.teamId} className={here(r.nameAr) || here(r.nameOriginal) ? "on" : undefined}>
                  <td>{r.rank}</td>
                  <td className="kpt-team">{r.nameAr || r.nameOriginal}</td>
                  <td>{r.played}</td>
                  <td>{r.wins}</td>
                  <td>{r.draws ?? "-"}</td>
                  <td>{r.losses ?? "-"}</td>
                  <td><b>{r.points}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
