import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Loader from "./Loader";
import MoroccansTodayPoster from "./MoroccansTodayPoster";
import MoroccansTodayDesign from "./MoroccansTodayDesign";
import TemplateUploader from "./TemplateUploader";
import ExportControls from "./ExportControls";
import { DEFAULT_MOROCCANS_TODAY_LAYOUT, type MoroccansTodayLayout } from "@/config/moroccansTodayLayout";
import { addUpWeek, dayLine, hasPlayed, sortRows, weekLine, type MoroccanDayRow, type MoroccanLine } from "@/lib/moroccanDay";
import { useCachedData } from "@/lib/useCachedData";
import { useFitWidth } from "@/lib/useFitWidth";
import { deepMerge } from "@/lib/persist";
import { backgroundFor, sharedCompetition, withBackgroundFooter } from "@/config/templates";
import { clearTemplate, getTemplate, setTemplate } from "@/lib/db";
import { useLang } from "@/lib/prefs";
import { todayMA } from "@/lib/today";

type Range = "today" | "yesterday" | "week";
const PREVIEW_W = 480;
const LKEY = "botola.moroccansTodayLayout";
const WEEK_DAYS = 7;
const DEFAULT_PICK = 8;
const MAX_ON_POSTER = 12;

const shiftDay = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
// Always Arabic: this prints on the poster.
const arDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("ar-MA", { weekday: "long", day: "numeric", month: "long" });

async function readDay(date: string): Promise<MoroccanDayRow[]> {
  const res = await fetch(`/api/moroccans/today?date=${date}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json.rows ?? [];
}

/**
 * Every Moroccan abroad, from the real lineups: who started, who came on, who
 * sat out and what they did. Pick the rows for the poster; a week adds each
 * player's matches up. Live remains the match screen.
 */
export default function MoroccansTodayStudio() {
  const { t } = useLang();
  const posterRef = useRef<HTMLDivElement>(null);
  const [paneRef, previewW] = useFitWidth<HTMLElement>(PREVIEW_W);
  const [layout, setLayout] = useState<MoroccansTodayLayout>(DEFAULT_MOROCCANS_TODAY_LAYOUT);
  const [templateSrc, setTemplateSrc] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("today");
  const [today] = useState(todayMA);
  const [picks, setPicks] = useState<string[] | null>(null); // null = the default few
  const [inlined, setInlined] = useState<Map<string, { photo: string | null; clubLogo: string | null }>>(new Map());
  const [week, setWeek] = useState<{ days: MoroccanDayRow[][]; done: number; failed: number } | null>(null);
  const [weekRun, setWeekRun] = useState(0);

  useEffect(() => {
    try { const r = localStorage.getItem(LKEY); if (r) setLayout(deepMerge(DEFAULT_MOROCCANS_TODAY_LAYOUT, JSON.parse(r))); } catch { /* defaults */ }
    getTemplate("moroccansToday").then(setTemplateSrc);
  }, []);
  const updateLayout = (n: MoroccansTodayLayout) => { setLayout(n); try { localStorage.setItem(LKEY, JSON.stringify(n)); } catch { /* private mode */ } };
  const onTemplate = (d: string | null) => { if (d) { setTemplateSrc(d); setTemplate(d, "moroccansToday"); } else { setTemplateSrc(null); clearTemplate("moroccansToday"); } };

  const date = range === "yesterday" ? shiftDay(today, -1) : today;
  const read = useCallback(() => readDay(date), [date]);
  const { data, loading, busy, error, refresh } = useCachedData<MoroccanDayRow[]>(range === "week" ? null : `moroccansToday:${date}`, read);
  const pickRange = (r: Range) => { setRange(r); setPicks(null); };

  // A week is seven days of match reads: one request at a time from here, so no
  // single server call runs out of time, and one bad day costs only that day.
  useEffect(() => {
    if (range !== "week") return;
    let live = true;
    setWeek({ days: [], done: 0, failed: 0 });
    (async () => {
      for (let i = 0; i < WEEK_DAYS && live; i++) {
        try {
          const rows = await readDay(shiftDay(today, -i));
          if (live) setWeek((w) => w && { ...w, days: [...w.days, rows], done: w.done + 1 });
        } catch {
          if (live) setWeek((w) => w && { ...w, done: w.done + 1, failed: w.failed + 1 });
        }
      }
    })();
    return () => { live = false; };
  }, [range, today, weekRun]);

  const dayRows = useMemo(() => sortRows(data ?? []), [data]);
  const weekRows = useMemo(() => addUpWeek(week?.days ?? []), [week]);
  const lines: MoroccanLine[] = useMemo(() => (range === "week" ? weekRows.map(weekLine) : dayRows.map(dayLine)), [range, weekRows, dayRows]);
  // Which day each line's images live on: the row's own, or a player's latest match.
  const dayOf = useMemo(() => new Map(range === "week" ? weekRows.map((r) => [r.source.key, r.source.date]) : dayRows.map((r) => [r.key, r.date])), [range, weekRows, dayRows]);
  const best = useMemo(() => {
    const played = range === "week" ? lines : lines.filter((_, i) => hasPlayed(dayRows[i]));
    return (played.length ? played : lines).slice(0, DEFAULT_PICK).map((l) => l.key);
  }, [range, lines, dayRows]);
  const chosen = useMemo(() => new Set(picks ?? best), [picks, best]);
  const picked = useMemo(() => lines.filter((l) => chosen.has(l.key)), [lines, chosen]);
  const onPoster = picked.slice(0, MAX_ON_POSTER);

  // Faces and crests are inlined for what is on the poster only, on demand.
  const missing = onPoster.filter((l) => !inlined.has(l.key)).map((l) => l.key);
  const missingKey = missing.join(",");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!missingKey) return;
    let live = true;
    let again: ReturnType<typeof setTimeout> | undefined;
    const byDay = new Map<string, string[]>();
    for (const k of missingKey.split(",")) {
      const d = dayOf.get(k);
      if (d) byDay.set(d, [...(byDay.get(d) ?? []), k]);
    }
    Promise.all(Array.from(byDay, ([d, keys]) =>
      fetch(`/api/moroccans/today?date=${d}&keys=${keys.join(",")}`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))))
      .then((all: Array<{ rows?: Array<{ key: string; photo: string | null; clubLogo: string | null }> }>) => {
        if (!live) return;
        setInlined((cur) => { const next = new Map(cur); for (const r of all.flatMap((j) => j.rows ?? [])) next.set(r.key, { photo: r.photo, clubLogo: r.clubLogo }); return next; });
      })
      .catch(() => { if (live) again = setTimeout(() => setRetry((n) => n + 1), 4000); });
    return () => { live = false; if (again) clearTimeout(again); };
  }, [missingKey, retry, dayOf]);

  const toggle = (key: string, on: boolean) => {
    const next = new Set(chosen);
    if (on) next.add(key); else next.delete(key);
    setPicks(lines.filter((l) => next.has(l.key)).map((l) => l.key));
  };

  const weekLoading = range === "week" && (week?.done ?? 0) < WEEK_DAYS;
  const isLoading = range === "week" ? weekLoading && lines.length === 0 : loading;
  const blocked = lines.length === 0
    ? null
    : picked.length === 0
      ? t("اختر لاعباً واحداً على الأقل", "Pick at least one player")
      : null;
  const preparing = missing.length > 0 ? t("جاري تجهيز صور اللاعبين…", "Preparing player photos…") : null;
  const title = range === "week" ? "المغاربة هذا الأسبوع" : range === "yesterday" ? "المغاربة أمس" : "المغاربة اليوم";
  const competition = sharedCompetition(onPoster.map((l) => l.competitionId));
  const background = backgroundFor(templateSrc, competition);
  const soloTitle = range === "week" ? "إحصائيات الأسبوع" : range === "yesterday" ? "إحصائيات الأمس" : "إحصائيات اليوم";
  const subtitle = range === "week" ? `${arDate(shiftDay(today, 1 - WEEK_DAYS))} - ${arDate(today)}` : arDate(date);
  const scale = previewW / layout.width;

  return (
    <div className="layout">
      <section className="controls">
        <div className="card">
          <h3>{t("المغاربة اليوم", "Moroccans today")}</h3>
          <p className="muted">{t("كل دولي مغربي خارج البطولة: من لعب أساسياً، ومن دخل بديلاً، ومن غاب، وما قدمه في مباراته.", "Every Morocco international abroad: who started, who came on, who sat out, and what they did.")}</p>
          <div className="seg" role="tablist" aria-label={t("الفترة")}>
            {([["today", t("اليوم", "Today")], ["yesterday", t("أمس", "Yesterday")], ["week", t("آخر 7 أيام", "Last 7 days")]] as Array<[Range, string]>).map(([r, label]) => (
              <button key={r} role="tab" aria-selected={range === r} className={range === r ? "seg-btn on" : "seg-btn"} onClick={() => pickRange(r)}>{label}</button>
            ))}
          </div>
          <div className="kv"><span>{t("على الملصق")}</span><b>{onPoster.length}{t(" من ")}{lines.length}</b></div>
          {range !== "week" && <div className="kv"><span>{t("شاركوا", "Played")}</span><b>{dayRows.filter(hasPlayed).length}{t(" من ")}{dayRows.length}</b></div>}
          {weekLoading && <div className="kv"><span>{t("جاري قراءة الأيام", "Reading days")}</span><b>{week?.done ?? 0}/{WEEK_DAYS}</b></div>}
          {error && <p className="err">{error}</p>}
          {range === "week" && !weekLoading && (week?.failed ?? 0) > 0 && (
            <p className="err">{t(`تعذرت قراءة ${week?.failed} من 7 أيام، فالأرقام ناقصة.`, `${week?.failed} of 7 days could not be read, so the totals are incomplete.`)}</p>
          )}
          {!isLoading && !weekLoading && !error && lines.length === 0 && (
            <p className="muted">{range === "week" ? t("لا توجد مشاركات مغربية في هذه الفترة.", "No Moroccan appearances in this period.") : t("لا يوجد لاعبون مغاربة في مباريات هذا اليوم.", "No Moroccan players in this day's matches.")}</p>
          )}
          <button className="btn" disabled={isLoading || weekLoading} onClick={() => (range === "week" ? setWeekRun((n) => n + 1) : refresh())}>
            {(busy || isLoading || weekLoading) && <i className="spinner" aria-hidden="true" />}
            {t("تحديث", "Refresh")}
          </button>
        </div>

        {lines.length > 0 && (
          <details className="card collapsible" open>
            <summary><h3>{t("اختيار اللاعبين (", "Pick players (")}{picked.length})</h3><span className="chev" /></summary>
            {picked.length > MAX_ON_POSTER && <p className="muted">{t(`يتسع الملصق لأول ${MAX_ON_POSTER} لاعباً.`, `The poster fits the first ${MAX_ON_POSTER} players.`)}</p>}
            <div className="row">
              <button type="button" className="btn ghost" onClick={() => setPicks(null)}>{t("الأفضل (")}{best.length})</button>
              <button type="button" className="btn ghost" onClick={() => setPicks([])}>{t("مسح")}</button>
            </div>
            <div className="pick-list">
              {lines.map((l, i) => (
                <label key={l.key} className="field check pick-match">
                  <input type="checkbox" checked={chosen.has(l.key)} onChange={(e) => toggle(l.key, e.target.checked)} />
                  <span>
                    <b>{l.name}</b>{" · "}<bdi>{l.meta}</bdi>
                    {range !== "week" && dayRows[i].isLive && <>{" · "}<b className="ma-live">{dayRows[i].clock || t("مباشر", "Live")}</b></>}
                    {l.chips.length > 0 && <>{" · "}<bdi>{l.chips.join("، ")}</bdi></>}
                  </span>
                </label>
              ))}
            </div>
          </details>
        )}

        <TemplateUploader isCustom={Boolean(templateSrc)} bundled={Boolean(background)} onTemplate={onTemplate} defaultLabel={t("لا يوجد قالب بعد — تُستخدم خلفية بسيطة. ارفع قالب المغاربة.")} resetLabel={t("حذف القالب")} />
        <ExportControls posterRef={posterRef} canExport={onPoster.length > 0} blocked={blocked} preparing={preparing} onResetDesign={() => updateLayout(DEFAULT_MOROCCANS_TODAY_LAYOUT)} fileBase={`choufsport-moroccans-${range === "week" ? "week" : date}`} />
        <MoroccansTodayDesign layout={layout} onChange={updateLayout} />
      </section>

      <section className="previewpane" ref={paneRef}>
        <div className="previewsticky">
          <h3 className="muted">{t("معاينة مباشرة")}</h3>
          <div className={isLoading || busy ? "previewbox busy" : "previewbox"} style={{ width: previewW, height: layout.height * scale }}>
            {isLoading && <div className="preview-loader"><Loader label={t("جاري تحميل البيانات…", "Loading data…")} /></div>}
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <MoroccansTodayPoster
                ref={posterRef} title={title} soloTitle={soloTitle} subtitle={subtitle} layout={withBackgroundFooter(layout, competition, background)} templateSrc={background}
                lines={onPoster.map((l) => ({ ...l, photo: inlined.get(l.key)?.photo ?? null, clubLogo: inlined.get(l.key)?.clubLogo ?? null }))}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
