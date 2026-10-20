import { useEffect, useState } from "react";
import type { AthleteBio, LineupPlayer, PerformerStat } from "@/types/live";

function Tiles({ rows }: { rows: PerformerStat[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="kpc-top">
      {rows.map((s) => (
        <div key={s.name} className="kpc-tile"><b>{s.value}</b><span>{s.name}</span></div>
      ))}
    </div>
  );
}

function List({ rows }: { rows: PerformerStat[] }) {
  if (rows.length === 0) return null;
  return (
    <ul className="kpc-list">
      {rows.map((s) => (
        <li key={s.name}><span>{s.name}</span><b>{s.value}</b></li>
      ))}
    </ul>
  );
}

/**
 * The player, not just their 90 minutes: this match's stat line when the source
 * publishes one, and the season behind it — per competition, the way 365scores'
 * own player page shows it.
 */
export default function PlayerCard({
  player, team, onClose,
}: {
  player: LineupPlayer; team: string; onClose: () => void;
}) {
  const [bio, setBio] = useState<AthleteBio | null>(null);
  const [tab, setTab] = useState<"season" | "match">(player.stats.length > 0 ? "match" : "season");

  useEffect(() => {
    if (!player.athleteId) return;
    let live = true;
    fetch(`/api/athlete/${player.athleteId}`)
      .then((r) => r.json())
      .then((j) => { if (live && j.bio) setBio(j.bio); })
      .catch(() => { /* the match stats still stand on their own */ });
    return () => { live = false; };
  }, [player.athleteId]);

  const matchTop = player.topStats.length ? player.topStats : player.stats.slice(0, 3);
  const matchRest = player.stats.filter((s) => !matchTop.some((t) => t.name === s.name));
  const seasons = bio?.seasons ?? [];

  return (
    <div className="kpc-back" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="kpc" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="kpc-x" onClick={onClose} aria-label="إغلاق">×</button>

        <header className="kpc-head">
          {player.photo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={player.photo} alt="" />
          ) : (
            <span className="kpc-num">{player.number ?? bio?.shirt ?? "?"}</span>
          )}
          <div>
            <h3>{player.name}</h3>
            <p>
              {(player.number ?? bio?.shirt) !== null && <span className="kpc-shirt">#{player.number ?? bio?.shirt}</span>}
              {(player.position || bio?.position) && <span>{player.position || bio?.position}</span>}
              <span>{team}</span>
            </p>
            {(bio?.nationality || bio?.age !== null) && (
              <p className="kpc-bio">
                {bio?.nationality && <span>{bio.nationality}</span>}
                {bio?.age != null && <span>{bio.age} سنة</span>}
                {/* the birth row is titled with the date and valued with the
                    age, which is already shown — so it reads as a birth date */}
                {bio?.details.filter((d) => d.name !== "الرقم مع النادي").map((d) => (
                  <span key={d.name}>{/^\d/.test(d.name) ? `مواليد ${d.name}` : `${d.name}: ${d.value}`}</span>
                ))}
              </p>
            )}
          </div>
          {player.rating !== null && (
            <span className={`kpc-rate${player.rating >= 7.5 ? " good" : player.rating < 6 ? " poor" : ""}`}>
              {player.rating.toFixed(1)}
            </span>
          )}
        </header>

        {player.stats.length > 0 && seasons.length > 0 && (
          <div className="kpc-tabs">
            <button type="button" className={tab === "match" ? "on" : ""} onClick={() => setTab("match")}>هذه المباراة</button>
            <button type="button" className={tab === "season" ? "on" : ""} onClick={() => setTab("season")}>إحصائيات الموسم</button>
          </div>
        )}

        {tab === "match" && player.stats.length > 0 && (
          <>
            <Tiles rows={matchTop} />
            <List rows={matchRest} />
          </>
        )}

        {(tab === "season" || player.stats.length === 0) && (
          seasons.length > 0 ? (
            seasons.map((s) => (
              <section key={s.competition} className="kpc-season">
                <h4>{s.competition}</h4>
                <Tiles rows={s.top} />
                <List rows={s.stats} />
              </section>
            ))
          ) : (
            <p className="kpc-none">
              {bio === null && player.athleteId ? "جاري تحميل إحصائيات اللاعب…" : "لا ينشر المصدر إحصائيات لهذا اللاعب."}
            </p>
          )
        )}
      </div>
    </div>
  );
}
