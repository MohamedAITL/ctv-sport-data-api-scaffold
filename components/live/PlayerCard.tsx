import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { AthleteBio, LineupPlayer, PerformerStat } from "@/types/live";
import { useLang } from "@/lib/prefs";

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
  const { t } = useLang();
  const [bio, setBio] = useState<AthleteBio | null>(null);
  // In native fullscreen the browser paints only the fullscreen element's own
  // subtree, so a card portaled to <body> would exist and measure but never be
  // seen. The host is therefore the fullscreen element when there is one.
  const [host, setHost] = useState<Element | null>(null);
  useEffect(() => {
    const pick = () => setHost(document.fullscreenElement ?? document.body);
    pick();
    document.addEventListener("fullscreenchange", pick);
    return () => document.removeEventListener("fullscreenchange", pick);
  }, []);
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

  if (!host) return null; // first client paint; the effect runs immediately after

  // Rendered outside the pitch: the card is an overlay on the whole screen, and
  // inside the pitch it would be at the mercy of any ancestor that creates a
  // containing block (a transform left by an animation did exactly that).
  return createPortal(
    <div className="kpc-back" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="kpc" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="kpc-x" onClick={onClose} aria-label={t("إغلاق")}>×</button>

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
                {bio?.age != null && <span>{bio.age}{t(" سنة")}</span>}
                {/* the birth row is titled with the date and valued with the
                    age, which is already shown — so it reads as a birth date */}
                {bio?.details.filter((d) => d.name !== "الرقم مع النادي").map((d) => (
                  <span key={d.name}>{/^\d/.test(d.name) ? t(`مواليد ${d.name}`, `Born ${d.name}`) : `${d.name}: ${d.value}`}</span>
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
            <button type="button" className={tab === "match" ? "on" : ""} onClick={() => setTab("match")}>{t("هذه المباراة")}</button>
            <button type="button" className={tab === "season" ? "on" : ""} onClick={() => setTab("season")}>{t("إحصائيات الموسم")}</button>
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
              {bio === null && player.athleteId ? t("جاري تحميل إحصائيات اللاعب…", "Loading player stats…") : t("لا تتوفر إحصائيات لهذا اللاعب.", "No stats are available for this player.")}
            </p>
          )
        )}
      </div>
    </div>,
    host
  );
}
