import { useEffect, useRef, useState } from "react";
import type { LiveDetail } from "@/types/live";

const kickoff = (iso: string) => {
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? "" : t.toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit" });
};

// The scoreline, sized to be read from across a room.
export default function LiveHeader({ d }: { d: LiveDetail }) {
  const m = d.match;
  // No score yet: the centre of the scoreline carries the kickoff time and the
  // status instead of a meaningless dash pair.
  const started = m.home.score !== null || m.away.score !== null;

  // A goal during the 15s refresh should be impossible to miss on a wall
  // screen, so the number that changed pulses once. Switching match is not a
  // goal, hence the id guard.
  const prev = useRef({ id: m.id, home: m.home.score, away: m.away.score });
  const [flash, setFlash] = useState({ home: false, away: false });
  useEffect(() => {
    const was = prev.current;
    prev.current = { id: m.id, home: m.home.score, away: m.away.score };
    if (was.id !== m.id) return;
    const next = {
      home: was.home !== null && m.home.score !== was.home,
      away: was.away !== null && m.away.score !== was.away,
    };
    if (!next.home && !next.away) return;
    setFlash(next);
    const t = setTimeout(() => setFlash({ home: false, away: false }), 950);
    return () => clearTimeout(t);
  }, [m.id, m.home.score, m.away.score]);

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
        {started ? (
          <div className="kh-nums">
            <b className={flash.home ? "flash" : undefined}>{m.home.score ?? "-"}</b>
            <span className="kh-dash">-</span>
            <b className={flash.away ? "flash" : undefined}>{m.away.score ?? "-"}</b>
          </div>
        ) : (
          <div className="kh-soon">
            <b>{kickoff(m.startTime) || "—"}</b>
            <span>{m.statusText}</span>
          </div>
        )}
        <div className="kh-side">
          {m.away.logo && /* eslint-disable-next-line @next/next/no-img-element */
            <img src={m.away.logo} alt="" />}
          <span>{m.away.name}</span>
        </div>
      </div>
      {(started || m.clock) && (
        <div className={m.isLive ? "kh-status live" : "kh-status"}>
          {m.isLive && <i className="kl-dot" />}
          {m.clock ? `${m.statusText} · ${m.clock}` : m.statusText}
        </div>
      )}
    </header>
  );
}
