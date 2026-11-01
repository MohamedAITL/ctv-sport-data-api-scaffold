import { useState } from "react";
import MomentExport, { type Moment } from "./MomentExport";
import type { LiveDetail } from "@/types/live";
import { useLang } from "@/lib/prefs";

// Timeline. Home events sit on one side of the spine, away on the other.
export default function LiveEvents({ d }: { d: LiveDetail }) {
  const { t } = useLang();
  const [moment, setMoment] = useState<Moment | null>(null);
  const started = d.match.isLive || d.match.isFinished;

  return (
    <>
      {started && (
        <button type="button" className="kpv-export" onClick={() => setMoment("final")}>{t("ملصق هدف أو نتيجة", "Goal or result poster")}</button>
      )}
      {moment !== null && <MomentExport match={d.match} initial={moment} onClose={() => setMoment(null)} />}
      {d.events.length === 0 ? (
        <div className="kp-none"><p>{t("لا توجد أحداث مسجلة بعد")}</p></div>
      ) : (
        <div className="ke">
          {d.events.map((e, i) => {
            const home = e.competitorId === d.match.home.id;
            const goal = d.goals.findIndex((g) => g.order === e.order);
            return (
              <div key={i} className={`ke-row ${home ? "home" : "away"}${e.isMajor ? " major" : ""}`}>
                <div className="ke-card">
                  <span className="ke-type">{e.type}</span>
                  {e.player && <span className="ke-player">{e.player}</span>}
                  {goal >= 0 && (
                    <button type="button" className="ke-poster" aria-label={t(`ملصق هدف ${e.player ?? ""}`, `Poster for ${e.player ?? "this"} goal`)} onClick={() => setMoment(goal)}>
                      {t("ملصق", "Poster")}
                    </button>
                  )}
                </div>
                <span className="ke-min">{e.minute}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
