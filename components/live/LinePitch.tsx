import { useCallback, useEffect, useRef, useState } from "react";
import PlayerCard from "./PlayerCard";
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

// Capture keeps a fast drag tracking, but it throws if the pointer has already
// gone. Losing capture must never lose the drop, so both calls are guarded.
const capture = (e: React.PointerEvent) => {
  try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* no active pointer */ }
};
const release = (e: React.PointerEvent) => {
  try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* already released */ }
};
const clamp = (n: number) => Math.min(98, Math.max(2, n));
// Below this the gesture was a tap, not a drag: a finger never lands perfectly
// still, so zero movement is the wrong test on a touchscreen.
const TAP_PX = 9;

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

function Bench({
  lineup, title, home, onBenchDown, placed, compact, onOpen,
}: {
  lineup: TeamLineup; title: string; home: boolean;
  onBenchDown: (p: LineupPlayer, home: boolean) => (e: React.PointerEvent) => void;
  placed: (p: LineupPlayer, home: boolean) => boolean;
  compact?: boolean;
  onOpen: (p: LineupPlayer, home: boolean) => void;
}) {
  return (
    <div className="kp-bench">
      <h4>{title}{lineup.formation ? ` · ${lineup.formation}` : ""}</h4>
      {lineup.bench.length > 0 && (
        <ul>
          {lineup.bench.map((p) => (
            <li
              key={p.id}
              className={`kp-draggable${placed(p, home) ? " on-pitch" : ""}`}
              onPointerDown={onBenchDown(p, home)}
            >
              <PlayerFace p={p} size={34} />
              <span>{p.shortName || p.name}</span>
              {placed(p, home) && <em className="kp-onpitch">في الملعب</em>}
            </li>
          ))}
        </ul>
      )}
      {!compact && lineup.missing.length > 0 && (
        <>
          <h5>غيابات</h5>
          <ul className="kp-out">
            {lineup.missing.map((p) => (
            <li key={p.id} onClick={() => onOpen(p, home)}><span>{p.shortName || p.name}</span></li>
          ))}
          </ul>
        </>
      )}
      {!compact && lineup.coach && <p className="kp-coach">المدرب: {lineup.coach.name}</p>}
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
  // A bench player being carried toward the pitch; rendered as a ghost that
  // follows the finger so the gesture is visible before it lands.
  const [ghost, setGhost] = useState<{ p: LineupPlayer; home: boolean; x: number; y: number } | null>(null);
  // Lit while a player is being dragged off the pitch, so "drop here to send
  // them back" is visible instead of something you have to guess.
  const [returning, setReturning] = useState(false);
  // Tapping a player opens their card; the same pointer path also drags, so a
  // gesture only counts as a tap if it barely moved.
  const [open, setOpen] = useState<{ p: LineupPlayer; home: boolean } | null>(null);
  const tap = useRef<{ x: number; y: number } | null>(null);
  const ghostRef = useRef<{ p: LineupPlayer; home: boolean } | null>(null);

  // Arrangements are per match and must survive the 15s auto-refresh.
  useEffect(() => { setMoved(loadMoved(gameId)); }, [gameId]);

  const store = useCallback((next: Moved) => {
    try { localStorage.setItem(key(gameId), JSON.stringify(next)); } catch { /* private mode */ }
  }, [gameId]);
  const persist = useCallback((next: Moved) => { setMoved(next); store(next); }, [store]);

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
    setReturning(true);
    tap.current = { x: e.clientX, y: e.clientY };
    capture(e);
  };

  const onMove = (e: React.PointerEvent) => {
    const drag = dragging.current;
    const box = pitchRef.current?.getBoundingClientRect();
    if (!drag || !box) return;
    const x = clamp(((e.clientX - box.left) / box.width) * 100 - drag.dx);
    const y = clamp(((e.clientY - box.top) / box.height) * 100 - drag.dy);
    setMoved((m) => ({ ...m, [drag.id]: { x, y } }));
  };

  const onUp = (p: LineupPlayer, home: boolean) => (e: React.PointerEvent) => {
    const drag = dragging.current;
    dragging.current = null;
    setReturning(false);
    if (!drag) return;
    release(e);
    const from = tap.current;
    tap.current = null;
    if (from && Math.abs(e.clientX - from.x) < TAP_PX && Math.abs(e.clientY - from.y) < TAP_PX) {
      setOpen({ p, home });
      return;
    }
    const box = pitchRef.current?.getBoundingClientRect();
    // Released off the pitch: a substitute goes back to the bench and a starter
    // back to their formation spot — both are simply "forget this position".
    const outside = box
      ? e.clientX < box.left || e.clientX > box.right ||
        e.clientY < box.top || e.clientY > box.bottom
      : false;
    setMoved((m) => {
      const next = { ...m };
      if (outside) delete next[drag.id];
      store(next);
      return next;
    });
  };

  // Dragging a substitute onto the pitch places them there; it is the same
  // pointer-event path as moving a starter, just starting outside the pitch.
  const onBenchDown = (p: LineupPlayer, home: boolean) => (e: React.PointerEvent) => {
    ghostRef.current = { p, home };
    setGhost({ p, home, x: e.clientX, y: e.clientY });
    tap.current = { x: e.clientX, y: e.clientY };
    capture(e);
  };

  const onBenchMove = (e: React.PointerEvent) => {
    if (!ghostRef.current) return;
    setGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : g));
  };

  const onBenchUp = (e: React.PointerEvent) => {
    const carried = ghostRef.current;
    ghostRef.current = null;
    setGhost(null);
    if (!carried) return;
    release(e);
    const from = tap.current;
    tap.current = null;
    if (from && Math.abs(e.clientX - from.x) < TAP_PX && Math.abs(e.clientY - from.y) < TAP_PX) {
      setOpen({ p: carried.p, home: carried.home });
      return;
    }
    const box = pitchRef.current?.getBoundingClientRect();
    if (!box) return;
    const inside =
      e.clientX >= box.left && e.clientX <= box.right &&
      e.clientY >= box.top && e.clientY <= box.bottom;
    if (!inside) return; // dropped outside — leave them on the bench
    const id = `${carried.home ? "h" : "a"}${carried.p.id}`;
    persist({
      ...moved,
      [id]: {
        x: clamp(((e.clientX - box.left) / box.width) * 100),
        y: clamp(((e.clientY - box.top) / box.height) * 100),
      },
    });
  };

  const isPlaced = (p: LineupPlayer, home: boolean) => Boolean(moved[`${home ? "h" : "a"}${p.id}`]);

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
  const big = full || cssFull;

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
        onPointerUp={onUp(p, home)}
        onPointerCancel={onUp(p, home)}
      >
        <PlayerFace p={p} size={big ? 72 : 54} />
        {p.rating !== null && <b className={`kp-rate${p.rating >= 7.5 ? " good" : p.rating < 6 ? " poor" : ""}`}>{p.rating.toFixed(1)}</b>}
        <span className="kp-name">{p.shortName || p.name}</span>
      </div>
    );
  };

  return (
    <div className={`kp${cssFull ? " cssfull" : ""}`} dir="rtl" ref={wrapRef}>
      <div className="kp-tools">
        <button type="button" className="kp-tool" onClick={toggleFull}>
          {big ? "خروج من ملء الشاشة" : "ملء الشاشة"}
        </button>
        {Object.keys(moved).length > 0 && (
          <button type="button" className="kp-tool" onClick={reset}>إعادة الترتيب</button>
        )}
        <span className="kp-hint">اضغط على لاعب لعرض إحصائياته — اسحبه لتغيير مكانه، أو خارج الملعب لإرجاعه</span>
      </div>

      {positioned ? (
        <div className="kp-pitch" ref={pitchRef}>
          <div className="kp-turf" />
          <div className="kp-mid" />
          <div className="kp-circle" />
          {/* Both goals: penalty area, six-yard box, spot, D and the net. */}
          {["home", "away"].map((side) => (
            <div key={side} className={`kp-goal ${side}`}>
              <i className="kp-box" />
              <i className="kp-sixyard" />
              <i className="kp-spot" />
              <i className="kp-arc" />
              <i className="kp-net" />
            </div>
          ))}
          {h?.starting.map((p) => shirt(p, true))}
          {a?.starting.map((p) => shirt(p, false))}
          {h?.bench.filter((p) => isPlaced(p, true)).map((p) => shirt(p, true))}
          {a?.bench.filter((p) => isPlaced(p, false)).map((p) => shirt(p, false))}
        </div>
      ) : (
        <div className="kp-xi">
          {[h, a].map((lu, i) =>
            lu ? (
              <div key={i}>
                <h4>{i === 0 ? d.match.home.name : d.match.away.name}{lu.formation ? ` · ${lu.formation}` : ""}</h4>
                <ul>
                  {lu.starting.map((p) => (
                    <li key={p.id} className="kp-tapable" onClick={() => setOpen({ p, home: i === 0 })}>
                      <PlayerFace p={p} size={34} />
                      <span>{p.name}</span>
                      {p.rating !== null && <b className="kp-rate">{p.rating.toFixed(1)}</b>}
                      <em>{p.position}</em>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          )}
        </div>
      )}

      <div
        className={`kp-benches${big ? " strip" : ""}${returning ? " dropzone" : ""}`}
        onPointerMove={onBenchMove}
        onPointerUp={onBenchUp}
        onPointerCancel={onBenchUp}
      >
        {h && <Bench lineup={h} title={d.match.home.name} home onBenchDown={onBenchDown} placed={isPlaced} compact={big} onOpen={(p, side) => setOpen({ p, home: side })} />}
        {a && <Bench lineup={a} title={d.match.away.name} home={false} onBenchDown={onBenchDown} placed={isPlaced} compact={big} onOpen={(p, side) => setOpen({ p, home: side })} />}
      </div>

      {open && (
        <PlayerCard
          player={open.p}
          team={open.home ? d.match.home.name : d.match.away.name}
          onClose={() => setOpen(null)}
        />
      )}

      {ghost && (
        <div className={`kp-ghost ${ghost.home ? "home" : "away"}`} style={{ left: ghost.x, top: ghost.y }}>
          <PlayerFace p={ghost.p} size={54} />
          <span className="kp-name">{ghost.p.shortName || ghost.p.name}</span>
        </div>
      )}
    </div>
  );
}
