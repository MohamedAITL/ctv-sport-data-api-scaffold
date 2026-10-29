import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import TotwPoster, { type TotwSlot } from "./TotwPoster";
import TotwDesign from "./TotwDesign";
import TemplateUploader from "./TemplateUploader";
import ExportControls from "./ExportControls";
import { DEFAULT_TOTW_LAYOUT, type TotwLayout } from "@/config/totwLayout";
import { leagueById } from "@/config/standingsLeagues";
import { FORMATIONS, formationSlots, roundOfKey, type RoundPool, type Totw, type TotwPlayer } from "@/lib/totw";
import { useCachedData } from "@/lib/useCachedData";
import { useFitWidth } from "@/lib/useFitWidth";
import { deepMerge } from "@/lib/persist";
import { clearTemplate, getTemplate, setTemplate } from "@/lib/db";
import { useLang } from "@/lib/prefs";

const PREVIEW_W = 480;
const LKEY = "botola.totwLayout";
const picksKey = (league: number, round: string) => `botola.totwPicks.${league}.${round}`;

interface TotwState { competition: number; totw: Totw | null; playedRounds: number[] }
/** What was changed by hand, per competition and round. */
interface Picks { formation?: string; slots?: Record<number, number>; coach?: number }

const label = (p: TotwPlayer) => `${p.number ?? ""} ${p.shortName || p.name}`.trim();
// A pool player whose face is not inlined yet must not reach the poster with a
// remote URL: html-to-image cannot read cross-origin pixels.
const faceless = (p: TotwPlayer): TotwPlayer => ({ ...p, photo: null, club: p.club && { ...p.club, logo: null } });

/**
 * "تشكيلة الجولة": 365scores' own team of the round where it publishes one,
 * otherwise a team picked by hand from the round's starters (Botola has no
 * ratings to pick it from). Either way every slot, the formation and the coach
 * can be changed, and the poster is designed like every other one.
 */
export default function TotwStudio({ league, leagueField }: { league: number; leagueField: ReactNode }) {
  const { t } = useLang();
  const posterRef = useRef<HTMLDivElement>(null);
  const [paneRef, previewW] = useFitWidth<HTMLElement>(PREVIEW_W);
  const [layout, setLayout] = useState<TotwLayout>(DEFAULT_TOTW_LAYOUT);
  const [templateSrc, setTemplateSrc] = useState<string | null>(null);
  const [weekKey, setWeekKey] = useState(""); // official round; "" = the latest
  const [manualRound, setManualRound] = useState<number | null>(null);
  const [picks, setPicks] = useState<Picks>({});
  const [editing, setEditing] = useState(false);
  const [faces, setFaces] = useState<Map<number, TotwPlayer>>(new Map());

  useEffect(() => {
    try { const r = localStorage.getItem(LKEY); if (r) setLayout(deepMerge(DEFAULT_TOTW_LAYOUT, JSON.parse(r))); } catch { /* defaults */ }
    getTemplate("totw").then(setTemplateSrc);
  }, []);
  useEffect(() => { setWeekKey(""); setManualRound(null); }, [league]);

  const updateLayout = (n: TotwLayout) => { setLayout(n); try { localStorage.setItem(LKEY, JSON.stringify(n)); } catch { /* private mode */ } };
  const onTemplate = (d: string | null) => { if (d) { setTemplateSrc(d); setTemplate(d, "totw"); } else { setTemplateSrc(null); clearTemplate("totw"); } };

  const readTotw = useCallback(async (): Promise<TotwState> => {
    const res = await fetch(`/api/totw?competition=${league}${weekKey ? `&key=${encodeURIComponent(weekKey)}` : ""}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Request failed");
    return { competition: league, totw: json.totw ?? null, playedRounds: json.playedRounds ?? [] };
  }, [league, weekKey]);
  const { data, loading, busy, error, refresh } = useCachedData<TotwState>(`totw:${league}:${weekKey}`, readTotw);
  const forLeague = data && data.competition === league ? data : null;
  const totw = forLeague?.totw ?? null;
  const official = Boolean(totw);

  // A hand-picked team defaults to the latest round played.
  const played = useMemo(() => forLeague?.playedRounds ?? [], [forLeague]);
  useEffect(() => {
    if (official || played.length === 0) return;
    setManualRound((cur) => (cur !== null && played.includes(cur) ? cur : played[played.length - 1]));
  }, [official, played]);
  // Building a team by hand needs the editor; an official one starts finished.
  useEffect(() => { if (forLeague) setEditing(!official); }, [forLeague, official]);

  const round = totw ? roundOfKey(totw.key) : manualRound;
  const roundId = totw ? totw.key : manualRound !== null ? `r${manualRound}` : "";
  const roundName = totw ? totw.rounds.find((r) => r.key === totw.key)?.name ?? t(`الجولة ${round}`, `Round ${round}`) : round !== null ? t(`الجولة ${round}`, `Round ${round}`) : "";

  useEffect(() => {
    if (!roundId) return;
    try { const r = localStorage.getItem(picksKey(league, roundId)); setPicks(r ? JSON.parse(r) : {}); } catch { setPicks({}); }
    setFaces(new Map());
  }, [league, roundId]);
  const savePicks = (next: Picks) => {
    setPicks(next);
    try { localStorage.setItem(picksKey(league, roundId), JSON.stringify(next)); } catch { /* private mode */ }
  };

  // The round's starters: always for a hand-picked team, and for an official
  // one only once you open the editor.
  const readPool = useCallback(async (): Promise<RoundPool> => {
    const res = await fetch(`/api/totw?competition=${league}&round=${round}&pool=1`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Request failed");
    return json as RoundPool;
  }, [league, round]);
  const needPool = round !== null && (!official || editing);
  const { data: pool, loading: poolLoading } = useCachedData<RoundPool>(needPool ? `totwpool:${league}:${round}` : null, readPool);

  const officialById = useMemo(() => new Map([...(totw?.players ?? []), ...(totw?.coach ? [totw.coach] : [])].map((p) => [p.id, p])), [totw]);
  const poolById = useMemo(() => new Map([...(pool?.players ?? []), ...(pool?.coaches ?? [])].map((p) => [p.id, p])), [pool]);
  const resolve = useCallback((id: number): TotwPlayer | null => {
    const ready = faces.get(id) ?? officialById.get(id);
    if (ready) return ready;
    const p = poolById.get(id);
    return p ? faceless(p) : null;
  }, [faces, officialById, poolById]);

  const formation = picks.formation ?? totw?.formation ?? "4-3-3";
  const slots: TotwSlot[] = useMemo(() => {
    let base: TotwSlot[];
    if (totw && !picks.formation) {
      base = totw.players.map((p) => ({ line: p.line, side: p.side, player: p }));
    } else {
      // An official team moved to another formation keeps its players in the
      // same back-to-front order.
      const order = [...(totw?.players ?? [])].sort((a, b) => (a.line ?? 0) - (b.line ?? 0) || (a.side ?? 0) - (b.side ?? 0));
      base = formationSlots(formation).map((s, i) => ({ ...s, player: order[i] ?? null }));
    }
    return base.map((s, i) => {
      const id = picks.slots?.[i];
      return id ? { ...s, player: resolve(id) } : s;
    });
  }, [totw, picks, formation, resolve]);
  const coach = picks.coach ? resolve(picks.coach) : totw?.coach ?? null;

  // Faces for whoever was picked from the pool, fetched as they are chosen.
  const missing = useMemo(() => {
    const ids = [...Object.values(picks.slots ?? {}), ...(picks.coach ? [picks.coach] : [])];
    return ids.filter((id) => !faces.has(id) && !officialById.has(id) && poolById.has(id));
  }, [picks, faces, officialById, poolById]);
  const missingKey = missing.join(",");
  useEffect(() => {
    if (!missingKey || round === null) return;
    let live = true;
    fetch(`/api/totw?competition=${league}&round=${round}&pool=1&faces=${missingKey}`)
      .then((r) => r.json())
      .then((j: { players?: TotwPlayer[] }) => {
        if (!live || !j.players) return;
        setFaces((m) => { const next = new Map(m); for (const p of j.players ?? []) next.set(p.id, p); return next; });
      })
      .catch(() => undefined);
    return () => { live = false; };
  }, [missingKey, league, round]);

  const taken = new Set(slots.map((s) => s.player?.id).filter((id): id is number => id !== undefined));
  const byClub = useMemo(() => {
    const groups = new Map<string, TotwPlayer[]>();
    for (const p of pool?.players ?? []) {
      const k = p.club?.name ?? "";
      groups.set(k, [...(groups.get(k) ?? []), p]);
    }
    return Array.from(groups.entries());
  }, [pool]);

  const pickSlot = (i: number, id: number) => {
    const next: Picks = { ...picks, slots: { ...(picks.slots ?? {}) } };
    if (id) next.slots![i] = id; else delete next.slots![i];
    savePicks(next);
  };

  const filled = slots.filter((s) => s.player).length;
  const blocked = !forLeague
    ? null
    : filled < slots.length
      ? t(`اختر ${slots.length} لاعباً (${filled}/${slots.length})`, `Pick ${slots.length} players (${filled}/${slots.length})`)
      : missing.length > 0
        ? t("جاري تجهيز صور اللاعبين…", "Preparing player photos…")
        : null;
  const subtitle = [(leagueById(league)?.ar ?? ""), roundName].filter(Boolean).join(" · ");
  const scale = previewW / layout.width;

  return (
    <div className="layout">
      <section className="controls">
        <div className="card">
          <h3>{t("تشكيلة الجولة")}</h3>
          {leagueField}
          <label className="field wide">
            <span>{t("الجولة")}</span>
            {totw ? (
              <select value={totw.key} onChange={(e) => setWeekKey(e.target.value)} disabled={loading}>
                {totw.rounds.map((r) => <option key={r.key} value={r.key}>{r.name}</option>)}
              </select>
            ) : (
              <select value={manualRound ?? ""} onChange={(e) => setManualRound(Number(e.target.value))} disabled={loading || played.length === 0}>
                {played.length === 0 && <option value="">—</option>}
                {played.map((r) => <option key={r} value={r}>{t("الجولة ")}{r}</option>)}
              </select>
            )}
          </label>
          <div className="kv"><span>{t("المصدر")}</span><b>{!forLeague ? "—" : official ? t("التشكيلة الرسمية", "Official team") : t("اختيار يدوي", "Picked by hand")}</b></div>
          {forLeague && !official && (
            <p className="muted">{t("لا تتوفر تشكيلة رسمية للجولة ولا تقييمات للاعبين في هذه المسابقة — اختر اللاعبين من أساسيي الجولة.")}</p>
          )}
          <div className="kv"><span>{t("الحالة")}</span><span className={loading ? "pill" : error ? "pill warn" : "pill ok"}>{loading ? t("جاري التحميل…", "Loading…") : error ? t("خطأ", "Error") : t("متصل", "Connected")}</span></div>
          {error && <p className="err">{error}</p>}
          {forLeague && !official && played.length === 0 && <p className="err">{t("لم تُلعب أي جولة بعد في هذه المسابقة.")}</p>}
          <button className="btn" disabled={loading} onClick={() => refresh()}>{loading || busy ? t("جاري التحديث…", "Refreshing…") : t("تحديث", "Refresh")}</button>
        </div>

        {round !== null && (
          <details className="card collapsible" open={editing} onToggle={(e) => setEditing((e.target as HTMLDetailsElement).open)}>
            <summary><h3>{official ? t("تعديل التشكيلة", "Edit the team") : t("اختيار التشكيلة", "Pick the team")}</h3><span className="chev" /></summary>
            <label className="field wide">
              <span>{t("الخطة")}</span>
              <select value={formation} onChange={(e) => savePicks({ ...picks, formation: e.target.value })}>
                {Array.from(new Set([...(totw?.formation ? [totw.formation] : []), ...FORMATIONS])).map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
            {poolLoading && !pool && <p className="kxp-wait"><i className="spinner" />{t("جاري تحميل أساسيي الجولة…")}</p>}
            {pool && (
              <>
                <label className="field wide">
                  <span>{t("المدرب")}</span>
                  <select value={coach?.id ?? ""} onChange={(e) => savePicks({ ...picks, coach: Number(e.target.value) || undefined })}>
                    <option value="">{totw?.coach ? totw.coach.name : t("— بدون —", "— none —")}</option>
                    {pool.coaches.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.club?.name}</option>)}
                  </select>
                </label>
                <div className="kxs">
                  {slots.map((s, i) => (
                    <label key={i} className={`field wide${picks.slots?.[i] ? " kxs-on" : ""}`}>
                      <span>{i === 0 ? t("حارس المرمى", "Goalkeeper") : s.player?.position ?? t(`اللاعب ${i + 1}`, `Player ${i + 1}`)}</span>
                      <select value={s.player?.id ?? ""} onChange={(e) => pickSlot(i, Number(e.target.value))}>
                        <option value="">{t("— اختر لاعباً —")}</option>
                        {s.player && !poolById.has(s.player.id) && <option value={s.player.id}>{label(s.player)} — {s.player.club?.name}</option>}
                        {byClub.map(([club, players]) => (
                          <optgroup key={club} label={club}>
                            {players
                              .filter((p) => p.id === s.player?.id || !taken.has(p.id))
                              .map((p) => <option key={p.id} value={p.id}>{label(p)}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </>
            )}
            {(picks.formation || picks.coach || Object.keys(picks.slots ?? {}).length > 0) && (
              <button type="button" className="btn ghost" onClick={() => savePicks({})}>{t("إلغاء كل التعديلات")}</button>
            )}
          </details>
        )}

        <TemplateUploader isCustom={templateSrc !== null} onTemplate={onTemplate} defaultLabel={t("لا يوجد قالب بعد — تُستخدم خلفية بسيطة. ارفع قالب تشكيلة الجولة.")} resetLabel={t("حذف القالب")} />
        <ExportControls posterRef={posterRef} canExport={Boolean(forLeague) && round !== null} blocked={blocked} onResetDesign={() => updateLayout(DEFAULT_TOTW_LAYOUT)} fileBase={`choufsport-totw-${league}-${round ?? "x"}`} />
        <TotwDesign layout={layout} onChange={updateLayout} />
      </section>

      <section className="previewpane" ref={paneRef}>
        <div className="previewsticky">
          <h3 className="muted">{t("معاينة مباشرة")}</h3>
          <div className={busy ? "previewbox busy" : "previewbox"} style={{ width: previewW, height: layout.height * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <TotwPoster ref={posterRef} subtitle={subtitle} slots={slots} coach={coach} formation={formation} layout={layout} templateSrc={templateSrc} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
