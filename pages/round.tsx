import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Nav from "@/components/Nav";
import MatchdayPoster from "@/components/MatchdayPoster";
import { useCachedData } from "@/lib/useCachedData";
import MatchdayDesign from "@/components/MatchdayDesign";
import MatchdayTeams from "@/components/MatchdayTeams";
import TemplateUploader from "@/components/TemplateUploader";
import ExportControls from "@/components/ExportControls";
import { DEFAULT_MATCHDAY_LAYOUT, type MatchdayLayout } from "@/config/matchdayLayout";
import { BOTOLA_LEAGUE, isStandingsLeague, leagueById, leaguesByGroup } from "@/config/standingsLeagues";
import { roundKey, UNSCHEDULED_ROUND, type RoundInfo } from "@/lib/scores365Games";
import type { Match } from "@/types/fixtures";
import { loadNameOverrides, saveNameOverrides, deepMerge } from "@/lib/persist";
import { getLogoOverrides, setLogoOverride, clearLogoOverride, getTemplate, setTemplate, clearTemplate } from "@/lib/db";
import { useFitWidth } from "@/lib/useFitWidth";
import { useLang } from "@/lib/prefs";

const PREVIEW_W = 480;
// A cup round can hold dozens of games; a poster holds about this many readably.
const DEFAULT_PICK = 20; // a full UCL league-phase round (18) fits
const LKEY = "botola.roundLayout";
const LEAGUE_KEY = "botola.roundLeague";
const loadLayout = (): MatchdayLayout => {
  try { const r = localStorage.getItem(LKEY); return r ? deepMerge(DEFAULT_MATCHDAY_LAYOUT, JSON.parse(r)) : DEFAULT_MATCHDAY_LAYOUT; } catch { return DEFAULT_MATCHDAY_LAYOUT; }
};
const saveLayout = (l: MatchdayLayout) => { try { localStorage.setItem(LKEY, JSON.stringify(l)); } catch { /* ignore */ } };

// Rounds come labelled from the server, in Arabic like all the data (and the poster).
// A game whose crests are not inlined yet must not reach the export with remote
// URLs: html-to-image cannot read cross-origin pixels.
const bare = (m: Match): Match => ({ ...m, leagueLogo: null, home: { ...m.home, badge: null }, away: { ...m.away, badge: null } });
interface RoundState { competition: number; matches: Match[]; rounds: RoundInfo[]; fetchedAt?: string; error?: string }


export default function RoundPage() {
  const { t } = useLang();
  const posterRef = useRef<HTMLDivElement>(null);
  const [paneRef, previewW] = useFitWidth<HTMLElement>(PREVIEW_W);
  const [league, setLeague] = useState<number>(BOTOLA_LEAGUE);
  const [round, setRound] = useState<number | null>(null);
  const [layout, setLayout] = useState<MatchdayLayout>(DEFAULT_MATCHDAY_LAYOUT);
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const [logoOverrides, setLogoOverrides] = useState<Record<string, string>>({});
  const [templateSrc, setTemplateSrc] = useState<string | null>(null);

  useEffect(() => {
    let initial = BOTOLA_LEAGUE;
    try { const s = localStorage.getItem(LEAGUE_KEY); if (s && isStandingsLeague(Number(s))) initial = Number(s); } catch { /* ignore */ }
    setLeague(initial);
    setLayout(loadLayout());
    setNameOverrides(loadNameOverrides());
    getLogoOverrides().then(setLogoOverrides);
    getTemplate("round").then(setTemplateSrc);
  }, []);

  // Last answer first, from IndexedDB, then the server behind it.
  const readRound = useCallback(async (): Promise<RoundState> => {
    const res = await fetch(`/api/round?competition=${league}`);
    const json = await res.json();
    // Thrown, not returned: an empty answer would replace the round on screen
    // and the cached copy. An unpublished schedule still arrives as a 200.
    if (!res.ok) throw new Error(json.error || "Request failed");
    return { competition: league, matches: json.matches ?? [], rounds: json.rounds ?? [], fetchedAt: json.fetchedAt, error: json.error };
  }, [league]);

  const { data, loading, busy, error: loadError, refresh: fetchRound } =
    useCachedData<RoundState>(`round2:${league}`, readRound);

  const forLeague = data && data.competition === league ? data : null;
  // A failed refresh keeps the last data on screen and says why.
  const shownError = loadError ?? forLeague?.error ?? null;
  const rounds = useMemo(() => forLeague?.rounds ?? [], [forLeague]);
  // Open on the round being played now: the one holding the match nearest to
  // today. The feed reaches several rounds ahead, so "the last" is the future.
  useEffect(() => {
    if (!forLeague || rounds.length === 0) { setRound(null); return; }
    const now = Date.now();
    const nearest = forLeague.matches.reduce<Match | null>((best, m) => {
      const d = Math.abs(new Date(m.kickoffUtc).getTime() - now);
      return !best || d < Math.abs(new Date(best.kickoffUtc).getTime() - now) ? m : best;
    }, null);
    const current = nearest ? roundKey(nearest) : rounds[rounds.length - 1].key;
    setRound((cur) => (cur !== null && rounds.some((r) => r.key === cur) ? cur : current));
  }, [forLeague, rounds]);

  const matches = useMemo(
    () => (forLeague && round !== null ? forLeague.matches.filter((m) => roundKey(m) === round) : []),
    [forLeague, round]
  );

  // Which of the round's games go on the poster: all of a normal round; of a
  // cup round with dozens (spread over weeks), the ones nearest to today.
  // Per round, for this visit only.
  const pickKey = `${league}:${round}`;
  const [picks, setPicks] = useState<Record<string, string[]>>({});
  const chosen = useMemo(() => {
    if (picks[pickKey]) return new Set(picks[pickKey]);
    const now = Date.now();
    const away = (m: Match) => Math.abs(new Date(m.kickoffUtc).getTime() - now);
    return new Set([...matches].sort((x, y) => away(x) - away(y)).slice(0, DEFAULT_PICK).map((m) => m.id));
  }, [picks, pickKey, matches]);
  const shown = useMemo(() => matches.filter((m) => chosen.has(m.id)), [matches, chosen]);
  const pick = (ids: string[]) => setPicks((p) => ({ ...p, [pickKey]: ids }));

  // The list carries crest URLs; the poster needs data URLs, fetched for the
  // round on screen only. Scores always come from the list — only the crests
  // are taken from the inlined copy, so a refresh never shows stale results.
  const [inlined, setInlined] = useState<Map<string, Match>>(new Map());
  useEffect(() => { setInlined(new Map()); }, [league]);
  const missingKey = shown.filter((m) => !inlined.has(m.id)).map((m) => m.id).join(",");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!missingKey || round === null) return;
    let live = true;
    let again: ReturnType<typeof setTimeout> | undefined;
    fetch(`/api/round?competition=${league}&round=${round}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { matches?: Match[] }) => {
        if (!live) return;
        const got = new Map((j.matches ?? []).map((m) => [m.id, m]));
        // A game the server no longer lists keeps its letters instead of a crest,
        // rather than blocking the export forever.
        setInlined((cur) => { const next = new Map(cur); for (const id of missingKey.split(",")) next.set(id, got.get(id) ?? bare(matches.find((m) => m.id === id) as Match)); return next; });
      })
      .catch(() => { if (live) again = setTimeout(() => setRetry((n) => n + 1), 4000); });
    return () => { live = false; if (again) clearTimeout(again); };
  }, [missingKey, league, round, retry, matches]);
  const posterMatches = useMemo(() => shown.map((m) => {
    const i = inlined.get(m.id);
    return i ? { ...m, leagueLogo: i.leagueLogo, home: { ...m.home, badge: i.home.badge }, away: { ...m.away, badge: i.away.badge } } : bare(m);
  }), [shown, inlined]);

  const finished = matches.filter((m) => m.isFinished).length;
  // Results by default once the whole round is played; either way by hand —
  // a round half played can be posted as results so far.
  const [chosenMode, setChosenMode] = useState<"fixtures" | "results" | null>(null);
  useEffect(() => { setChosenMode(null); }, [league, round]);
  const results = chosenMode ? chosenMode === "results" : matches.length > 0 && finished === matches.length;

  const pickLeague = (id: number) => {
    if (id === league) return;
    try { localStorage.setItem(LEAGUE_KEY, String(id)); } catch { /* ignore */ }
    setRound(null);
    setLeague(id); // the hook swaps in that league's cached payload, then refreshes
  };
  const updateLayout = (n: MatchdayLayout) => { setLayout(n); saveLayout(n); };
  const onName = (id: string, v: string) => setNameOverrides((p) => { const next = { ...p, [id]: v }; saveNameOverrides(next); return next; });
  const onLogo = (id: string, d: string) => { setLogoOverrides((p) => ({ ...p, [id]: d })); setLogoOverride(id, d); };
  const onClearLogo = (id: string) => { setLogoOverrides((p) => { const n = { ...p }; delete n[id]; return n; }); clearLogoOverride(id); };
  const onTemplate = (d: string | null) => { if (d) { setTemplateSrc(d); setTemplate(d, "round"); } else { setTemplateSrc(null); clearTemplate("round"); } };

  // A round usually spans several days, so label it with the range it covers
  // rather than just the first match's date.
  const dateRange = useMemo(() => {
    const days = Array.from(new Set(matches.map((m) => m.date).filter(Boolean))).sort();
    if (days.length === 0) return "";
    return days.length === 1 ? days[0] : `${days[0]} ← ${days[days.length - 1]}`;
  }, [matches]);

  const effLayout = useMemo((): MatchdayLayout => {
    // The poster is Arabic in both languages. The unscheduled bucket already
    // reads "مباريات قادمة", so only a real round gets the "مباريات"/"نتائج" prefix.
    const label = rounds.find((r) => r.key === round)?.label ?? "";
    const unscheduled = round === UNSCHEDULED_ROUND;
    const fixturesText = round === null ? "" : unscheduled ? label : `مباريات ${label}`;
    const resultsText = round === null ? "" : unscheduled ? label : `نتائج ${label}`;
    return {
      ...layout,
      title: { ...layout.title, show: true, text: fixturesText },
      resultsTitle: { ...layout.resultsTitle, show: true, text: resultsText },
      dateLabel: { ...layout.dateLabel, text: dateRange },
    };
  }, [layout, round, rounds, dateRange]);

  const scale = previewW / layout.width;
  // No games for a league means 365scores hasn't published its schedule yet —
  // a normal state, so say so plainly instead of exporting an empty poster.
  const empty = !loading && forLeague !== null && rounds.length === 0;
  const exportBlock = empty
    ? t("جدول هذه البطولة غير منشور بعد", "This competition's schedule is not published yet")
    : matches.length === 0
    ? t("لا توجد مباريات في هذه الجولة بعد", "No matches in this round yet")
    : shown.length === 0
    ? t("اختر مباراة واحدة على الأقل", "Pick at least one match")
    : results && finished === 0
    ? t("لم تنته أي مباراة في هذه الجولة بعد", "No match in this round has finished yet")
    : missingKey
    ? t("جاري تجهيز شعارات المباريات المختارة…", "Preparing the picked matches' crests…")
    : null;

  return (
    <>
      <Head><title>{t("ملصق الجولة — شوف تي في")}</title></Head>
      <main className="app">
        <header className="topbar">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="brandlogo" src="/chouftv-logo.png" alt="Chouf TV" />
          </div>
          <Nav />
        </header>
        <div className="pagehead">
          <h1>{t("ملصق الجولة")}</h1>
          <span className="muted">{(leagueById(league)?.ar ?? "")}{t(" · مباريات حسب الجولة · مباشر · تصدير 1080×1350 PNG")}</span>
        </div>

        <div className="layout">
          <section className="controls">
            <div className="card">
              <h3>{t("الجولة")}</h3>
              <div className="seg" role="tablist" aria-label={t("نوع الملصق")}>
                <button role="tab" aria-selected={!results} className={!results ? "seg-btn on" : "seg-btn"} onClick={() => setChosenMode("fixtures")}>{t("المباريات")}</button>
                <button role="tab" aria-selected={results} className={results ? "seg-btn on" : "seg-btn"} onClick={() => setChosenMode("results")}>{t("النتائج (")}{finished}/{matches.length})</button>
              </div>
              <label className="field wide">
                <span>{t("البطولة")}</span>
                <select value={league} onChange={(e) => pickLeague(Number(e.target.value))} disabled={loading}>
                  {leaguesByGroup().map((g) => (
                    <optgroup key={g.group} label={t(g.group)}>
                      {g.leagues.map((l) => <option key={l.id} value={l.id}>{l.ar}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="field wide">
                <span>{t("الجولة")}</span>
                <select value={round ?? ""} onChange={(e) => setRound(Number(e.target.value))} disabled={loading || rounds.length === 0}>
                  {rounds.length === 0 && <option value="">—</option>}
                  {rounds.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </label>
              <div className="kv"><span>{t("المباريات")}</span><b>{matches.length}{matches.length > 0 ? t(` · ${finished} انتهت`, ` · ${finished} finished`) : ""}</b></div>
              <div className="kv"><span>{t("آخر تحديث")}</span><b>{forLeague?.fetchedAt ? new Date(forLeague.fetchedAt).toLocaleString() : "—"}</b></div>
              <div className="kv"><span>{t("الحالة")}</span><span className={loading ? "pill" : shownError ? "pill warn" : "pill ok"}>{loading ? t("جاري التحميل…", "Loading…") : shownError ? t("خطأ", "Error") : t("متصل", "Connected")}</span></div>
              {empty && (
                <p className="err">{t("لم يُنشر برنامج هذه المسابقة بعد. سيظهر هنا عند الإعلان عن الجولة المقبلة.")}</p>
              )}
              {shownError && <p className="err">{shownError}</p>}
              <button className="btn" disabled={loading} onClick={() => fetchRound()}>{loading ? t("جاري التحديث…", "Refreshing…") : t("تحديث", "Refresh")}</button>
            </div>
            {matches.length > 0 && (
              <details className="card collapsible" open={matches.length > DEFAULT_PICK}>
                <summary><h3>{t("اختيار المباريات (")}{shown.length}/{matches.length})</h3><span className="chev" /></summary>
                <div className="row">
                  <button type="button" className="btn ghost" onClick={() => pick(matches.map((m) => m.id))}>{t("الكل")}</button>
                  <button type="button" className="btn ghost" onClick={() => pick([])}>{t("مسح")}</button>
                </div>
                <div className="pick-list">
                  {matches.map((m) => (
                    <label key={m.id} className="field check pick-match">
                      <input type="checkbox" checked={chosen.has(m.id)} onChange={(e) => pick(matches.filter((x) => (x.id === m.id ? e.target.checked : chosen.has(x.id))).map((x) => x.id))} />
                      <span>{m.date.slice(5)} {m.time} · <bdi>{m.home.nameAr}</bdi> - <bdi>{m.away.nameAr}</bdi></span>
                    </label>
                  ))}
                </div>
              </details>
            )}
            <TemplateUploader isCustom={templateSrc !== null} onTemplate={onTemplate} defaultLabel={t("لا يوجد قالب بعد — تُستخدم خلفية بسيطة. ارفع قالب الجولة.")} resetLabel={t("حذف القالب")} />
            <ExportControls posterRef={posterRef} canExport={matches.length > 0} blocked={exportBlock} onResetDesign={() => updateLayout(DEFAULT_MATCHDAY_LAYOUT)} fileBase={`choufsport-round-${league}-${round ?? "x"}`} fileDate={matches[0]?.date} />
            <MatchdayTeams matches={shown} nameOverrides={nameOverrides} logoOverrides={logoOverrides} onName={onName} onLogo={onLogo} onClearLogo={onClearLogo} />
            <MatchdayDesign layout={layout} onChange={updateLayout} />
          </section>

          <section className="previewpane" ref={paneRef}>
            <div className="previewsticky">
              <h3 className="muted">{t("معاينة مباشرة")}</h3>
              <div className={busy ? "previewbox busy" : "previewbox"} style={{ width: previewW, height: layout.height * scale }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <MatchdayPoster ref={posterRef} groupBy="date" mode={results ? "results" : "fixtures"} matches={posterMatches} layout={effLayout} templateSrc={templateSrc} nameOverrides={nameOverrides} logoOverrides={logoOverrides} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
