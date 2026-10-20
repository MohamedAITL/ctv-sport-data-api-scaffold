import { useEffect, useState } from "react";
import type { AthleteBio, LineupPlayer } from "@/types/live";

// Everything shown here except the bio is already in the match payload, so the
// card fills instantly and the one request only adds age/nationality.
export default function PlayerCard({
  player, team, onClose,
}: {
  player: LineupPlayer; team: string; onClose: () => void;
}) {
  const [bio, setBio] = useState<AthleteBio | null>(null);

  useEffect(() => {
    if (!player.athleteId) return;
    let live = true;
    fetch(`/api/athlete/${player.athleteId}`)
      .then((r) => r.json())
      .then((j) => { if (live && j.bio) setBio(j.bio); })
      .catch(() => { /* bio is a bonus, never the point */ });
    return () => { live = false; };
  }, [player.athleteId]);

  const top = player.topStats.length ? player.topStats : player.stats.slice(0, 3);
  return (
    <div className="kpc-back" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="kpc" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="kpc-x" onClick={onClose} aria-label="إغلاق">×</button>

        <header className="kpc-head">
          {player.photo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={player.photo} alt="" />
          ) : (
            <span className="kpc-num">{player.number ?? "?"}</span>
          )}
          <div>
            <h3>{player.name}</h3>
            <p>
              {player.number !== null && <span className="kpc-shirt">#{player.number}</span>}
              {player.position && <span>{player.position}</span>}
              <span>{team}</span>
            </p>
            {(bio?.age || bio?.nationality) && (
              <p className="kpc-bio">
                {bio.nationality && <span>{bio.nationality}</span>}
                {bio.age !== null && <span>{bio.age} سنة</span>}
              </p>
            )}
          </div>
          {player.rating !== null && (
            <span className={`kpc-rate${player.rating >= 7.5 ? " good" : player.rating < 6 ? " poor" : ""}`}>
              {player.rating.toFixed(1)}
            </span>
          )}
        </header>

        {player.stats.length === 0 ? (
          <p className="kpc-none">لا توجد إحصائيات لهذا اللاعب في هذه المباراة.</p>
        ) : (
          <>
            <div className="kpc-top">
              {top.map((s) => (
                <div key={s.name} className="kpc-tile"><b>{s.value}</b><span>{s.name}</span></div>
              ))}
            </div>
            <ul className="kpc-list">
              {player.stats.map((s) => (
                <li key={s.name}><span>{s.name}</span><b>{s.value}</b></li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
