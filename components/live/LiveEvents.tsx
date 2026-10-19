import type { LiveDetail } from "@/types/live";

// Timeline. Home events sit on one side of the spine, away on the other.
export default function LiveEvents({ d }: { d: LiveDetail }) {
  if (d.events.length === 0) {
    return <div className="kp-none" dir="rtl"><p>لا توجد أحداث مسجلة بعد</p></div>;
  }
  return (
    <div className="ke" dir="rtl">
      {d.events.map((e, i) => {
        const home = e.competitorId === d.match.home.id;
        return (
          <div key={i} className={`ke-row ${home ? "home" : "away"}${e.isMajor ? " major" : ""}`}>
            <div className="ke-card">
              <span className="ke-type">{e.type}</span>
              {e.player && <span className="ke-player">{e.player}</span>}
            </div>
            <span className="ke-min">{e.minute}</span>
          </div>
        );
      })}
    </div>
  );
}
