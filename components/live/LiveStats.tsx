import { useState } from "react";
import type { LiveDetail, Performer } from "@/types/live";

// Before kickoff the source publishes no match statistics at all, only season
// leaders per line — so the tab shows those rather than dead-ending.
function PerformerCard({ p, side }: { p: Performer | null; side: "home" | "away" }) {
  if (!p) return <div className={`kt-p ${side} empty`} />;
  return (
    <div className={`kt-p ${side}`}>
      {p.photo ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={p.photo} alt="" />
      ) : null}
      <div className="kt-info">
        <b>{p.name}</b>
        {p.position && <span>{p.position}</span>}
        <ul>
          {p.stats.map((s) => (
            <li key={s.name}><i>{s.value}</i> {s.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Paired comparison bars. `valuePercentage` already encodes each side's share,
// so the bars are drawn straight from it.
export default function LiveStats({ d }: { d: LiveDetail }) {
  const [group, setGroup] = useState(0);
  const [majorOnly, setMajorOnly] = useState(false);

  if (d.statGroups.length === 0) {
    if (d.topPerformers.length === 0) {
      return (
        <div className="kp-none" dir="rtl">
          <p>الإحصائيات غير متوفرة</p>
          <span>{d.match.isLive || d.match.isFinished ? "لا ينشر المصدر إحصائيات هذه المباراة" : "تظهر الإحصائيات عند انطلاق المباراة"}</span>
        </div>
      );
    }
    return (
      <div className="kt" dir="rtl">
        <h3>أفضل اللاعبين هذا الموسم</h3>
        {d.topPerformers.map((r) => (
          <div key={r.name} className="kt-row">
            <h4>{r.name}</h4>
            <div className="kt-pair">
              <PerformerCard p={r.home} side="home" />
              <PerformerCard p={r.away} side="away" />
            </div>
          </div>
        ))}
        <p className="kt-note">لم تبدأ المباراة بعد — إحصائيات اللقاء تظهر عند انطلاقه.</p>
      </div>
    );
  }

  const active = d.statGroups[Math.min(group, d.statGroups.length - 1)];
  const rows = majorOnly ? active.rows.filter((s) => s.isMajor) : active.rows;
  return (
    <div className="ks" dir="rtl">
      {d.statGroups.length > 1 && (
        <div className="ks-periods">
          {d.statGroups.map((g, i) => (
            <button key={g.id} type="button" className={i === group ? "ks-period on" : "ks-period"} onClick={() => setGroup(i)}>
              {g.name}
            </button>
          ))}
        </div>
      )}
      <div className="ks-toggle">
        <button type="button" className={majorOnly ? "ks-btn" : "ks-btn on"} onClick={() => setMajorOnly(false)}>كل الإحصائيات ({active.rows.length})</button>
        <button type="button" className={majorOnly ? "ks-btn on" : "ks-btn"} onClick={() => setMajorOnly(true)}>الأهم</button>
      </div>
      {rows.map((s) => (
        <div key={s.id} className="ks-row">
          <div className="ks-head">
            <b>{s.homeValue || "0"}</b>
            <span>{s.name}</span>
            <b>{s.awayValue || "0"}</b>
          </div>
          <div className="ks-bars">
            <div className="ks-bar home"><i style={{ width: `${s.homePercent}%` }} /></div>
            <div className="ks-bar away"><i style={{ width: `${s.awayPercent}%` }} /></div>
          </div>
        </div>
      ))}

      {d.facts.length > 0 && (
        <div className="kf">
          <h3>كيف مرّت المباراة</h3>
          {d.facts.map((b) => (
            <div key={b.title} className="kf-block">
              <h4>{b.title}</h4>
              <ul>
                {b.rows.map((r) => (
                  <li key={r.name} className={r.away === undefined ? undefined : "paired"}>
                    <b>{r.value || "—"}</b>
                    <span>{r.name}</span>
                    {r.away !== undefined && <b>{r.away || "—"}</b>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
