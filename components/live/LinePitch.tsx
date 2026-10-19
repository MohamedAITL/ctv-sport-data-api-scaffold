import { useCallback, useEffect, useRef, useState } from "react";
import type { LineupPlayer, LiveDetail, TeamLineup } from "@/types/live";

// `line` is depth from a team's own goal (0-100) and `side` is lateral (0-100).
// Home sits on the right, matching the right-to-left header and match list.
const formationSpot = (p: LineupPlayer, home: boolean) => {
  const depth = ((p.line ?? 50) / 100) * 46; // keep clear of the touchline
  return {
    x: home ? 98 - depth : 2 + depth,
    y: Math.min(94, Math.max(6, p.side ?? 50)),
  };
};

type Pos = { x: number; y: number };
type Moved = Record<string, Pos>;

const key = (gameId: number) => `live.pitch.${gameId}`;
const clamp = (n: number) => Math.min(98, Math.max(2, n));

function loadMoved(gameId: number): Moved {
  try {
    const raw = localStorage.getItem(key(gameId));
    return raw ? (JSON.parse(raw) as Moved) : {};
  } catch {
    return {};
  }
}

function PlayerFace({ p, size }: { p: LineupPlayer; size: number }) {
  // Some player photos 404; fall back to the number chip rather than a broken icon.
  const [broken, setBroken] = useState(false);
  if (!p.photo || broken) {
    return <span className="kp-num" style={{ width: size, height: size }}>{p.number ?? "?"}</span>;
  }
  return (
    <span className="kp-face" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.photo} alt="" onError={() => setBroken(true)} />
      {p.number !== null && <b>{p.number}</b>}
    </span>
  );
}

function Bench({ lineup, title }: { lineup: TeamLineup; title: string }) {
  return (
    <div className="kp-bench">
      <h4>{title}{lineup.formation ? ` · ${lineup.formation}` : ""}</h4>
      {lineup.bench.length > 0 && (
        <ul>
          {lineup.bench.map((p) => (
            <li key={p.id}>
              <PlayerFace p={p} size={34} />
              <span>{p.shortName || p.name}</span>
            </li>
          ))}
        </ul>
      )}
      {lineup.missing.length > 0 && (
        <>
          <h5>غيابات</h5>
          <ul className="kp-out">
            {lineup.missing.map((p) => <li key={p.id}><span>{p.shortName || p.name}</span></li>)}
          </ul>
        </>
      )}
      {lineup.coach && <p className="kp-coach">المدرب: {lineup.coach.name}</p>}
    </div>
  );
}

export default function LinePitch({ d }: { d: LiveDetail }) {
  const { homeLineup: h, awayLineup: a } = d;
  const gameId = d.match.id;
  const pitchRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [moved, setMoved] = useState<Moved>({});
  const [full, setFull] = useState(false);
  const [cssFull, setCssFull] = useState(false); // used when the API is blocked
  const dragging = useRef<{ id: string; dx: number; dy: number } | null>(null);

  // Arrangements are per match and must survive the 15s auto-refresh.
  useEffect(() => { setMoved(loadMoved(gameId)); }, [gameId]);

  const persist = useCallback((next: Moved) => {
    setMoved(next);
    try { localStorage.setItem(key(gameId), JSON.stringify(next)); } catch { /* private mode */ }
  }, [gameId]);

  useEffect(() => {
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFull = async () => {
    const el = wrapRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (el.requestFullscreen) await el.requestFullscreen();
      else setCssFull((v) => !v); // no API — fall back to filling the window
    } catch {
      setCssFull((v) => !v); // blocked (common in locked-down kiosk browsers)
    }
  };

  // Pointer events cover touch, pen and mouse in one path; capture keeps a fast
  // drag tracking even when the finger outruns the element.
  const onDown = (id: string, home: boolean, p: LineupPlayer) => (e: React.PointerEvent) => {
    const box = pitchRef.current?.getBoundingClientRect();
    if (!box) return;
    const cur = moved[id] ?? formationSpot(p, home);
    dragging.current = {
      id,
      dx: ((e.clientX - box.left) / box.width) * 100 - cur.x,
      dy: ((e.clientY - box.top) / box.height) * 100 - cur.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const drag = dragging.current;
    const box = pitchRef.current?.getBoundingClientRect();
    if (!drag || !box) return;
    const x = clamp(((e.clientX - box.left) / box.width) * 100 - drag.dx);
    const y = clamp(((e.clientY - box.top) / box.height) * 100 - drag.dy);
    setMoved((m) => ({ ...m, [drag.id]: { x, y } }));
  };

  const onUp = (e: React.PointerEvent) => {
    const drag = dragging.current;
    dragging.current = null;
    if (!drag) return;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    setMoved((m) => { persist(m); return m; });
  };

  const reset = () => {
    try { localStorage.removeItem(key(gameId)); } catch { /* ignore */ }
    setMoved({});
  };

  if (!h && !a) {
    return (
      <div className="kp-none" dir="rtl">
        <p>التشكيلة غير متوفرة لهذه المباراة</p>
        <span>لا ينشر المصدر تشكيلات هذه المسابقة</span>
      </div>
    );
  }
  const positioned = Boolean(h?.hasFieldPositions && a?.hasFieldPositions);

  const shirt = (p: LineupPlayer, home: boolean) => {
    const id = `${home ? "h" : "a"}${p.id}`;
    const pos = moved[id] ?? formationSpot(p, home);
    return (
      <div
        key={id}
        className={`kp-man ${home ? "home" : "away"}${moved[id] ? " moved" : ""}`}
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        onPointerDown={onDown(id, home, p)}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <PlayerFace p={p} size={full || cssFull ? 72 : 54} />
        <span className="kp-name">{p.shortName || p.name}</span>
      </div>
    );
  };

  return (
    <div className={`kp${cssFull ? " cssfull" : ""}`} dir="rtl" ref={wrapRef}>
      <div className="kp-tools">
        <button type="button" className="kp-tool" onClick={toggleFull}>
          {full || cssFull ? "خروج من ملء الشاشة" : "ملء الشاشة"}
        </button>
        {Object.keys(moved).length > 0 && (
          <button type="button" className="kp-tool" onClick={reset}>إعادة الترتيب</button>
        )}
        <span className="kp-hint">اسحب اللاعبين لتغيير أماكنهم</span>
      </div>

      {positioned ? (
        <div className="kp-pitch" ref={pitchRef}>
          <div className="kp-mid" />
          <div className="kp-circle" />
          {h?.starting.map((p) => shirt(p, true))}
          {a?.starting.map((p) => shirt(p, false))}
        </div>
      ) : (
        <div className="kp-xi">
          {[h, a].map((lu, i) =>
            lu ? (
              <div key={i}>
                <h4>{i === 0 ? d.match.home.name : d.match.away.name}{lu.formation ? ` · ${lu.formation}` : ""}</h4>
                <ul>
                  {lu.starting.map((p) => (
                    <li key={p.id}>
                      <PlayerFace p={p} size={34} />
                      <span>{p.name}</span>
                      <em>{p.position}</em>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>
      )}

      {!(full || cssFull) && (
        <div className="kp-benches">
          {h && <Bench lineup={h} title={d.match.home.name} />}
          {a && <Bench lineup={a} title={d.match.away.name} />}
        </div>
      )}
    </div>
  );
}
