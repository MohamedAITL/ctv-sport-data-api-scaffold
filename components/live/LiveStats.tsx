import { useState } from "react";
import type { LiveDetail } from "@/types/live";

// Paired comparison bars. `valuePercentage` already encodes each side's share,
// so the bars are drawn straight from it.
export default function LiveStats({ d }: { d: LiveDetail }) {
  const [majorOnly, setMajorOnly] = useState(false);
  if (d.stats.length === 0) {
    return <div className="kp-none" dir="rtl"><p>الإحصائيات غير متوفرة بعد</p></div>;
  }
  const rows = majorOnly ? d.stats.filter((s) => s.isMajor) : d.stats;
  return (
    <div className="ks" dir="rtl">
      <div className="ks-toggle">
        <button type="button" className={majorOnly ? "ks-btn" : "ks-btn on"} onClick={() => setMajorOnly(false)}>كل الإحصائيات</button>
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
    </div>
  );
}
