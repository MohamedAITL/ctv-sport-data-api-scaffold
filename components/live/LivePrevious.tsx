import { useEffect, useState } from "react";
import H2HExport from "./H2HExport";
import type { LiveDetail, PastMatch, PreviousMatches } from "@/types/live";
import type { TeamRow } from "@/types/standings";
import { useLang } from "@/lib/prefs";

// Short and fixed-width, so the dates line up down the column.
const day = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;
};

// Win / draw / loss for the team whose form this is.
const outcome = (m: PastMatch, team: number): "w" | "d" | "l" | null => {
  if (m.home.score === null || m.away.score === null) return null;
  const isHome = m.home.id === team;
  const [us, them] = isHome ? [m.home.score, m.away.score] : [m.away.score, m.home.score];
  return us > them ? "w" : us < them ? "l" : "d";
};

function Crest({ src }: { src: string | null }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return <span className="kpv-crest" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="kpv-crest" src={src} alt="" onError={() => setBroken(true)} />;
}

/**
 * One past match, always read from `team`'s point of view: that side stays in
 * the same column down the whole list, with the opponent opposite, so the
 * crests and names line up instead of swapping places whenever the fixture was
 * away. Where it was played is kept as a word next to the date rather than by
 * moving the teams around.
 */
function Row({ m, team }: { m: PastMatch; team: number }) {
  const { t } = useLang();
  const weHosted = m.home.id === team;
  const ours = weHosted ? m.home : m.away;
  const theirs = weHosted ? m.away : m.home;
  const r = outcome(m, team);
  return (
    <li className="kpv-row">
      <i className={r ? `kpv-pill ${r}` : "kpv-pill none"} aria-hidden={!r}>
        {r === "w" ? t("ف", "W") : r === "l" ? t("خ", "L") : r === "d" ? t("ت", "D") : ""}
      </i>
      <span className="kpv-when">
        <b>{day(m.date)}</b>
        <em>{weHosted ? t("على أرضه", "Home") : t("خارج أرضه", "Away")} · {m.competition}</em>
      </span>
      {/* The two sides and the score are one block, so it centres itself in
          whatever room is left beside the date rather than drifting. */}
      <span className="kpv-match">
        <span className={r === "w" ? "kpv-team won" : "kpv-team"}>
          <span className="kpv-name">{ours.name}</span>
          <Crest src={ours.logo} />
        </span>
        <b className="kpv-score">{ours.score ?? "-"}<i>-</i>{theirs.score ?? "-"}</b>
        <span className={r === "l" ? "kpv-team away won" : "kpv-team away"}>
          <Crest src={theirs.logo} />
          <span className="kpv-name">{theirs.name}</span>
        </span>
      </span>
    </li>
  );
}

export default function LivePrevious({ d }: { d: LiveDetail }) {
  const { t } = useLang();
  const [data, setData] = useState<PreviousMatches | null>(null);
  const [exporting, setExporting] = useState(false);
  const [table, setTable] = useState<TeamRow[]>([]);
  const [error, setError] = useState(false);
  const { home, away } = d.match;

  useEffect(() => {
    let live = true;
    setData(null);
    setError(false);
    fetch(`/api/live/previous?game=${d.match.id}&matchup=${encodeURIComponent(d.match.matchupId)}&home=${home.id}&away=${away.id}&competition=${d.match.competitionId}`)
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        if (j.previous) { setData(j.previous); setTable(j.table ?? []); } else setError(true);
      })
      .catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [d.match.id, d.match.matchupId, home.id, away.id, d.match.competitionId]);

  if (error) return <div className="kp-none"><p>{t("تعذر تحميل المواجهات السابقة")}</p></div>;
  if (!data) return <div className="kp-none"><p>{t("جاري التحميل…")}</p></div>;

  const here = (name: string) => name === home.name || name === away.name;
  const empty = data.home.length === 0 && data.away.length === 0 && table.length === 0 && data.h2h.length === 0;
  if (empty) {
    return (
      <div className="kp-none">
        <p>{t("لا توجد مباريات سابقة")}</p>
        <span>{t("لا ينشر المصدر نتائج سابقة لهذين الفريقين")}</span>
      </div>
    );
  }

  return (
    <div className="kpv">
      {/* The section is always here: when two sides have never met, saying so
          is information — hiding it just looks like something failed to load. */}
      <section>
        <h3>{t("المواجهات المباشرة")}</h3>
        {data.h2h.length === 0 ? (
          <p className="kpv-empty">{t("لم يسبق للفريقين أن التقيا — لا توجد مواجهات سابقة بينهما.")}</p>
        ) : (
          <>
          {data.record.played > 0 && (
            <div className="kh2h">
              <div className="kh2h-side">
                <b>{data.record.homeWins}</b>
                <span>{home.name}</span>
              </div>
              <div className="kh2h-side draw">
                <b>{data.record.draws}</b>
                <span>{t("تعادل")}</span>
              </div>
              <div className="kh2h-side">
                <b>{data.record.awayWins}</b>
                <span>{away.name}</span>
              </div>
              <p className="kh2h-meta">
                {data.record.played}{t(" مواجهة · الأهداف ")}{data.record.homeGoals} - {data.record.awayGoals}
              </p>
            </div>
          )}
            <ul>{data.h2h.map((m) => <Row key={m.id} m={m} team={home.id} />)}</ul>
            <button type="button" className="kpv-export" onClick={() => setExporting(true)}>
              {t("تصدير ملصق آخر 5 مواجهات", "Export the last 5 meetings poster")}
            </button>
          </>
        )}
      </section>
      {exporting && <H2HExport match={d.match} onClose={() => setExporting(false)} />}
      {data.home.length > 0 && (
        <section>
          <h3>{t("آخر مباريات ")}{home.name}</h3>
          <ul>{data.home.map((m) => <Row key={m.id} m={m} team={home.id} />)}</ul>
        </section>
      )}
      {data.away.length > 0 && (
        <section>
          <h3>{t("آخر مباريات ")}{away.name}</h3>
          <ul>{data.away.map((m) => <Row key={m.id} m={m} team={away.id} />)}</ul>
        </section>
      )}
      {table.length > 0 && (
        <section>
          <h3>{d.match.competition}{t(" — الترتيب")}</h3>
          <table className="kpt">
            <thead>
              <tr><th>#</th><th>{t("الفريق")}</th><th>{t("لعب")}</th><th>{t("فاز")}</th><th>{t("تعادل")}</th><th>{t("خسر")}</th><th>{t("نقاط")}</th></tr>
            </thead>
            <tbody>
              {table.map((r) => (
                <tr key={r.teamId} className={here(r.nameAr) || here(r.nameOriginal) ? "on" : undefined}>
                  <td>{r.rank}</td>
                  <td className="kpt-team">{r.nameAr || r.nameOriginal}</td>
                  <td>{r.played}</td>
                  <td>{r.wins}</td>
                  <td>{r.draws ?? "-"}</td>
                  <td>{r.losses ?? "-"}</td>
                  <td><b>{r.points}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
