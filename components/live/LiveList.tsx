import { useState } from "react";
import type { LiveMatch, LiveTeam } from "@/types/live";

// Crests 404 when the payload carried no imageVersion; show nothing rather than
// a broken-image icon on a wall display.
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
  return (
    <div className="kl-list" dir="rtl">
      {groups.map((g) => (
        <section key={g.id} className="kl-group">
          <h3 className="kl-grouphead">
            <CompLogo src={g.logo} />
            <span>{g.name}</span>
            <em>{g.matches.length}</em>
          </h3>
          {g.matches.map((m) => (
            <button
              key={m.id}
              type="button"
              className={m.id === selectedId ? "kl-row on" : "kl-row"}
              onClick={() => onSelect(m)}
            >
              <div className="kl-row-top">
                {m.isLive ? (
                  <span className="kl-live"><i className="kl-dot" />{m.clock || "مباشر"}</span>
                ) : (
                  <span className="kl-when">{m.isFinished ? "انتهت" : m.startTime.slice(11, 16)}</span>
                )}
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
