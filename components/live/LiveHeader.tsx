import type { LiveDetail } from "@/types/live";

// The scoreline, sized to be read from across a room.
export default function LiveHeader({ d }: { d: LiveDetail }) {
  const m = d.match;
  return (
    <header className="kh" dir="rtl">
      <div className="kh-meta">
        <span>{m.competition}</span>
        {d.venue && <span>· {d.venue}</span>}
        {d.referee && <span>· الحكم: {d.referee}</span>}
        {d.tv.length > 0 && <span>· {d.tv.slice(0, 2).join("، ")}</span>}
      </div>
      <div className="kh-score">
        <div className="kh-side">
          {m.home.logo && /* eslint-disable-next-line @next/next/no-img-element */
            <img src={m.home.logo} alt="" />}
          <span>{m.home.name}</span>
        </div>
        <div className="kh-nums">
          <b>{m.home.score ?? "-"}</b>
          <span className="kh-dash">-</span>
          <b>{m.away.score ?? "-"}</b>
        </div>
        <div className="kh-side">
          {m.away.logo && /* eslint-disable-next-line @next/next/no-img-element */
            <img src={m.away.logo} alt="" />}
          <span>{m.away.name}</span>
        </div>
      </div>
      <div className={m.isLive ? "kh-status live" : "kh-status"}>
        {m.isLive && <i className="kl-dot" />}
        {m.clock ? `${m.statusText} · ${m.clock}` : m.statusText}
      </div>
    </header>
  );
}
