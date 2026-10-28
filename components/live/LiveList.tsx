import { useEffect, useState } from "react";
import type { LiveMatch, LiveTeam, MoroccanPlayer } from "@/types/live";

// Crests 404 when the payload carried no imageVersion; show nothing rather than
// a broken-image icon on a wall display.
// The Morocco internationals on a game abroad: up to three faces, and who.
function Moroccans({ players }: { players: MoroccanPlayer[] }) {
  const names = players.map((p) => p.name);
  return (
    <span className="kl-ma" title={names.join("، ")}>
      {players.slice(0, 3).map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={p.id} src={p.photo ?? ""} alt="" />
      ))}
      <em>{names.slice(0, 2).join(" · ")}{names.length > 2 ? ` +${names.length - 2}` : ""}</em>
    </span>
  );
}

function Crest({ team }: { team: LiveTeam }) {
  const [broken, setBroken] = useState(false);
  if (!team.logo || broken) return <span className="kl-crest" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={team.logo} alt="" onError={() => setBroken(true)} />;
}

function CompLogo({ src }: { src: string | null }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" onError={() => setBroken(true)} />;
}

interface Props {
  matches: LiveMatch[];
  selectedId: number | null;
  onSelect: (m: LiveMatch) => void;
}

// Which competitions the operator has folded away. Kept per browser so a wall
// screen comes back up the way it was left.
const CLOSED_KEY = "live.closedCompetitions";

function loadClosed(): number[] {
  try {
    const raw = localStorage.getItem(CLOSED_KEY);
    const ids = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(ids) ? ids.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
}

/**
 * One block per competition, keeping the order the matches arrive in — which is
 * already live-first, then the competitions the app follows. A day can carry
 * 200 matches across 60 competitions, and an ungrouped list of those is
 * unreadable from across a room.
 */
export function groupByCompetition(matches: LiveMatch[]) {
  const groups: Array<{ id: number; name: string; logo: string | null; matches: LiveMatch[] }> = [];
  const byId = new Map<number, number>();
  for (const m of matches) {
    let i = byId.get(m.competitionId);
    if (i === undefined) {
      i = groups.length;
      byId.set(m.competitionId, i);
      groups.push({ id: m.competitionId, name: m.competition, logo: m.competitionLogo, matches: [] });
    }
    groups[i].matches.push(m);
  }
  return groups;
}

// Left rail. Rows are full-width tap targets — on a wall screen a finger is the
// only pointer, so there is no hover state to lean on.
export default function LiveList({ matches, selectedId, onSelect }: Props) {
  const groups = groupByCompetition(matches);
  const [closed, setClosed] = useState<number[]>([]);
  // localStorage is read after mount so the server and the first client render
  // agree.
  useEffect(() => { setClosed(loadClosed()); }, []);

  const toggle = (id: number) => {
    setClosed((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      try { localStorage.setItem(CLOSED_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  };

  return (
    <div className="kl-list" dir="rtl">
      {groups.map((g) => (
        <section key={g.id} className={closed.includes(g.id) ? "kl-group closed" : "kl-group"}>
          <button
            type="button"
            className="kl-grouphead"
            aria-expanded={!closed.includes(g.id)}
            onClick={() => toggle(g.id)}
          >
            <CompLogo src={g.logo} />
            <span>{g.name}</span>
            <em>{g.matches.length}</em>
            <i className="kl-chev" aria-hidden="true" />
          </button>
          {!closed.includes(g.id) && g.matches.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`kl-row${m.id === selectedId ? " on" : ""}${m.moroccans ? " ma" : ""}`}
              onClick={() => onSelect(m)}
            >
              <div className="kl-row-top">
                {m.isLive ? (
                  <span className="kl-live"><i className="kl-dot" />{m.clock || "مباشر"}</span>
                ) : (
                  <span className="kl-when">{m.isFinished ? "انتهت" : m.startTime.slice(11, 16)}</span>
                )}
                {m.moroccans && <Moroccans players={m.moroccans} />}
              </div>
              <div className="kl-team">
                <Crest team={m.home} />
                <span className="kl-name">{m.home.name}</span>
                <span className="kl-score">{m.home.score ?? "-"}</span>
              </div>
              <div className="kl-team">
                <Crest team={m.away} />
                <span className="kl-name">{m.away.name}</span>
                <span className="kl-score">{m.away.score ?? "-"}</span>
              </div>
            </button>
          ))}
        </section>
      ))}
      {matches.length === 0 && <p className="kl-empty">لا توجد مباريات</p>}
    </div>
  );
}
