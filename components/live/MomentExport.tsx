import { useEffect, useRef, useState } from "react";
import GoalPoster from "./GoalPoster";
import GoalDesign from "./GoalDesign";
import FullTimePoster from "./FullTimePoster";
import FullTimeDesign from "./FullTimeDesign";
import PosterExport from "./PosterExport";
import { DEFAULT_GOAL_LAYOUT, type GoalLayout } from "@/config/goalLayout";
import { DEFAULT_FULL_TIME_LAYOUT, type FullTimeLayout } from "@/config/fullTimeLayout";
import { goalsAddUp } from "@/lib/goals";
import type { LiveDetail, LiveMatch } from "@/types/live";
import { useLang } from "@/lib/prefs";

export type Moment = "final" | number; // a goal, by its place in `goals`
interface MomentLayout { goal: GoalLayout; final: FullTimeLayout }
const DEFAULTS: MomentLayout = { goal: DEFAULT_GOAL_LAYOUT, final: DEFAULT_FULL_TIME_LAYOUT };

/**
 * Exports the match's moments: any goal, or the score with every scorer. One
 * window for both, so moving between them never closes it. Fetches with
 * `inline=1` so faces and crests are data URLs html-to-image can read.
 */
export default function MomentExport({ match, initial, onClose }: { match: LiveMatch; initial: Moment; onClose: () => void }) {
  const { t } = useLang();
  // Read through a ref: the language settles just after mount, and a fetch
  // must not run twice for it.
  const tRef = useRef(t);
  tRef.current = t;
  const [d, setD] = useState<LiveDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState<Moment>(initial);

  useEffect(() => {
    let live = true;
    fetch(`/api/live/${match.id}?matchup=${encodeURIComponent(match.matchupId)}&inline=1`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => { if (live) setD(j.detail ?? null); })
      .catch(() => { if (live) setError(tRef.current("تعذر تجهيز الملصق.", "Could not prepare the poster.")); });
    return () => { live = false; };
  }, [match.id, match.matchupId]);

  const goal = d && pick !== "final" ? d.goals[pick] ?? null : null;
  // Mid-update the goals can trail the score: print the match's score, never a wrong one.
  const addsUp = d ? goalsAddUp(d.goals, d.match) : true;

  return (
    <PosterExport<MomentLayout>
      title={goal ? t("ملصق الهدف", "Goal poster") : t("ملصق النتيجة", "Result poster")}
      layoutKey="botola.momentLayout"
      templateKey={goal ? "goal" : "fullTime"}
      defaults={DEFAULTS}
      fileBase={`choufsport-${goal ? `goal-${goal.order}` : "result"}-${match.home.id}-${match.away.id}`}
      ready={Boolean(d)}
      error={error}
      onClose={onClose}
      poster={(ref, l, tpl) => d && (goal
        ? <GoalPoster ref={ref} match={d.match} goal={goal} score={addsUp ? goal.score : { home: d.match.home.score, away: d.match.away.score }} layout={l.goal} templateSrc={tpl} />
        : <FullTimePoster ref={ref} match={d.match} goals={addsUp ? d.goals : []} shootout={d.shootout} layout={l.final} templateSrc={tpl} />
      )}
      design={(l, set) => (goal
        ? <GoalDesign layout={l.goal} onChange={(n) => set({ ...l, goal: n })} />
        : <FullTimeDesign layout={l.final} onChange={(n) => set({ ...l, final: n })} />
      )}
      note={() => d && !addsUp && (
        <p className="kxp-note">
          {goal
            ? t("أهداف هذه المباراة غير مكتملة، فيعرض الملصق نتيجتها الحالية.", "This match's goal list is incomplete, so the poster shows its current score.")
            : t("قائمة الهدافين غير مكتملة، فلا تظهر على الملصق.", "The scorer list is incomplete, so it is left off the poster.")}
        </p>
      )}
      aside={d && (
        <div className="card">
          <h3>{t("ماذا تريد نشره؟", "What do you want to post?")}</h3>
          <div className="kxp-moments">
            <button type="button" className={`kxp-btn${pick === "final" ? " on" : ""}`} aria-pressed={pick === "final"} onClick={() => setPick("final")}>
              {t("النتيجة", "Result")}
            </button>
            {d.goals.map((g, i) => (
              <button key={g.order} type="button" className={`kxp-btn${pick === i ? " on" : ""}`} aria-pressed={pick === i} onClick={() => setPick(i)}>
                <bdi dir="ltr">{g.minute}</bdi> <bdi>{g.player ?? t("هدف", "Goal")}</bdi>
              </button>
            ))}
          </div>
        </div>
      )}
    />
  );
}
