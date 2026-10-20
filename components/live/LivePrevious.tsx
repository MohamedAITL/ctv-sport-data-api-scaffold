import { useEffect, useState } from "react";
import type { LiveDetail, PastMatch, PreviousMatches } from "@/types/live";

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
  const [error, setError] = useState(false);
  const { home, away } = d.match;

  useEffect(() => {
    let live = true;
    setData(null);
    setError(false);
    fetch(`/api/live/previous?home=${home.id}&away=${away.id}`)
      .then((r) => r.json())
      .then((j) => { if (live) { if (j.previous) setData(j.previous); else setError(true); } })
      .catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [home.id, away.id]);

  if (error) return <div className="kp-none" dir="rtl"><p>تعذر تحميل المواجهات السابقة</p></div>;
  if (!data) return <div className="kp-none" dir="rtl"><p>جاري التحميل…</p></div>;

  const empty = data.h2h.length === 0 && data.home.length === 0 && data.away.length === 0;
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
          <h3>مواجهات مباشرة</h3>
          <ul>{data.h2h.map((m) => <Row key={m.id} m={m} />)}</ul>
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
    </div>
  );
}
