import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MoroccanPoster, { ordinal } from "./MoroccanPoster";
import MoroccanDesign from "./MoroccanDesign";
import TemplateUploader from "./TemplateUploader";
import ExportControls from "./ExportControls";
import { DEFAULT_MOROCCAN_LAYOUT, type MoroccanLayout } from "@/config/moroccanLayout";
import type { MoroccanHighlight } from "@/lib/moroccanHighlights";
import { useCachedData } from "@/lib/useCachedData";
import { useFitWidth } from "@/lib/useFitWidth";
import { deepMerge } from "@/lib/persist";
import { clearTemplate, getTemplate, setTemplate } from "@/lib/db";

const PREVIEW_W = 480;
const LKEY = "botola.moroccanLayout";
const PICKS_KEY = "botola.moroccanPicks";
const MAX_INLINE = 40;
const DEFAULT_PICK = 8;

// A highlight whose images are not inlined yet must not reach the poster with
// remote URLs: html-to-image cannot read cross-origin pixels.
const bare = (h: MoroccanHighlight): MoroccanHighlight => ({ ...h, photo: null, clubLogo: null, competitionLogo: null });

async function readHighlights(): Promise<MoroccanHighlight[]> {
  const res = await fetch("/api/moroccans");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "فشل الطلب");
  return json.highlights ?? [];
}

/**
 * "المغاربة": every Morocco international in a top-20 leaderboard of the
 * followed competitions. Pick the highlights; one makes a spotlight poster,
 * several a roundup.
 */
export default function MoroccanStudio() {
  const posterRef = useRef<HTMLDivElement>(null);
  const [paneRef, previewW] = useFitWidth<HTMLElement>(PREVIEW_W);
  const [layout, setLayout] = useState<MoroccanLayout>(DEFAULT_MOROCCAN_LAYOUT);
  const [templateSrc, setTemplateSrc] = useState<string | null>(null);
  const [picks, setPicks] = useState<string[] | null>(null); // null = the best few
  const [query, setQuery] = useState("");
  const [showNegative, setShowNegative] = useState(false);
  const [inlined, setInlined] = useState<Map<string, MoroccanHighlight>>(new Map());

  useEffect(() => {
    try { const r = localStorage.getItem(LKEY); if (r) setLayout(deepMerge(DEFAULT_MOROCCAN_LAYOUT, JSON.parse(r))); } catch { /* defaults */ }
    try { const r = localStorage.getItem(PICKS_KEY); if (r) setPicks(JSON.parse(r)); } catch { /* none saved */ }
    getTemplate("moroccans").then(setTemplateSrc);
  }, []);
  const updateLayout = (n: MoroccanLayout) => { setLayout(n); try { localStorage.setItem(LKEY, JSON.stringify(n)); } catch { /* private mode */ } };
  const onTemplate = (d: string | null) => { if (d) { setTemplateSrc(d); setTemplate(d, "moroccans"); } else { setTemplateSrc(null); clearTemplate("moroccans"); } };
  const savePicks = (next: string[] | null) => {
    setPicks(next);
    try { if (next) localStorage.setItem(PICKS_KEY, JSON.stringify(next)); else localStorage.removeItem(PICKS_KEY); } catch { /* private mode */ }
  };

  const read = useCallback(readHighlights, []);
  const { data, loading, busy, error, refresh } = useCachedData<MoroccanHighlight[]>("moroccans", read);
  const all = useMemo(() => data ?? [], [data]);

  const best = useMemo(() => all.filter((h) => !h.negative && h.rank <= 3).slice(0, DEFAULT_PICK).map((h) => h.key), [all]);
  const chosen = useMemo(() => new Set(picks ?? best), [picks, best]);
  const picked = useMemo(() => all.filter((h) => chosen.has(h.key)), [all, chosen]);

  // Faces and crests are inlined for the picked highlights only, on demand.
  const missing = picked.filter((h) => !inlined.has(h.key)).map((h) => h.key);
  const missingKey = missing.slice(0, MAX_INLINE).join(",");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!missingKey) return;
    let live = true;
    let again: ReturnType<typeof setTimeout> | undefined;
    fetch(`/api/moroccans?keys=${missingKey}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { highlights?: MoroccanHighlight[] }) => {
        if (!live) return;
        setInlined((cur) => { const next = new Map(cur); for (const h of j.highlights ?? []) next.set(h.key, h); return next; });
      })
      .catch(() => { if (live) again = setTimeout(() => setRetry((n) => n + 1), 4000); });
    return () => { live = false; if (again) clearTimeout(again); };
  }, [missingKey, retry]);

  const onPoster = picked.map((h) => inlined.get(h.key) ?? bare(h));

  // The list, by player: each Moroccan once, with every leaderboard he is in.
  const q = query.trim();
  const byPlayer = useMemo(() => {
    const groups = new Map<number, MoroccanHighlight[]>();
    for (const h of all) {
      if (h.negative && !showNegative) continue;
      if (q && !h.name.includes(q) && !h.competition.includes(q) && !h.category.includes(q)) continue;
      groups.set(h.playerId, [...(groups.get(h.playerId) ?? []), h]);
    }
    return Array.from(groups.values());
  }, [all, showNegative, q]);

  const toggle = (list: MoroccanHighlight[], on: boolean) => {
    const next = new Set(chosen);
    for (const h of list) { if (on) next.add(h.key); else next.delete(h.key); }
    savePicks(all.filter((h) => next.has(h.key)).map((h) => h.key));
  };

  const blocked = !data
    ? null
    : picked.length === 0
      ? "اختر إحصائية واحدة على الأقل"
      : missing.length > 0
        ? "جاري تجهيز صور اللاعبين…"
        : null;
  const scale = previewW / layout.width;

  return (
    <div className="layout">
      <section className="controls">
        <div className="card">
          <h3>المغاربة في الصدارة</h3>
          <p className="muted">الدوليون المغاربة ضمن أفضل 20 في إحصائيات كل مسابقة. اختر إحصائية واحدة لبطاقة فردية، أو عدة إحصائيات لقائمة.</p>
          <div className="kv"><span>على الملصق</span><b>{picked.length} من {all.length}{picked.length === 1 ? " · بطاقة فردية" : ""}</b></div>
          <div className="kv"><span>الحالة</span><span className={loading ? "pill" : error ? "pill warn" : "pill ok"}>{loading ? "جاري التحميل…" : error ? "خطأ" : "متصل"}</span></div>
          {error && <p className="err">{error}</p>}
          {data && all.length === 0 && <p className="muted">لا يوجد لاعب مغربي ضمن أفضل 20 في أي مسابقة حالياً.</p>}
          <button className="btn" disabled={loading} onClick={() => refresh()}>{loading || busy ? "جاري التحديث…" : "تحديث"}</button>
        </div>

        {all.length > 0 && (
          <details className="card collapsible" open>
            <summary><h3>اختيار الإحصائيات ({picked.length})</h3><span className="chev" /></summary>
            <div className="row">
              <button type="button" className="btn ghost" onClick={() => savePicks(null)}>الأفضل ({best.length})</button>
              <button type="button" className="btn ghost" onClick={() => savePicks(all.filter((h) => showNegative || !h.negative).map((h) => h.key))}>الكل</button>
              <button type="button" className="btn ghost" onClick={() => savePicks([])}>مسح</button>
            </div>
            <label className="field wide">
              <span>بحث عن لاعب أو مسابقة</span>
              <input type="search" dir="rtl" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="مثال: حكيمي، الدوري الإسباني" />
            </label>
            <label className="field check">
              <input type="checkbox" checked={showNegative} onChange={(e) => setShowNegative(e.target.checked)} />
              <span>إظهار الإحصائيات السلبية (البطاقات)</span>
            </label>
            <div className="pick-list">
              {byPlayer.map((list) => {
                const on = list.filter((h) => chosen.has(h.key)).length;
                return (
                  <details key={list[0].playerId} className="pick-group" open={on > 0 || Boolean(q)}>
                    <summary>
                      <input
                        type="checkbox" checked={on === list.length} aria-label={`كل إحصائيات ${list[0].name}`}
                        onClick={(e) => e.stopPropagation()} onChange={(e) => toggle(list, e.target.checked)}
                      />
                      <b>{list[0].name}</b> <span className="muted">({on}/{list.length})</span>
                    </summary>
                    {list.map((h) => (
                      <label key={h.key} className="field check pick-match">
                        <input type="checkbox" checked={chosen.has(h.key)} onChange={(e) => toggle([h], e.target.checked)} />
                        <span>{ordinal(h.rank)} · {h.category} <bdi dir="ltr">({h.value})</bdi> — {h.competition}</span>
                      </label>
                    ))}
                  </details>
                );
              })}
            </div>
          </details>
        )}

        <TemplateUploader isCustom={templateSrc !== null} onTemplate={onTemplate} defaultLabel="لا يوجد قالب بعد — تُستخدم خلفية بسيطة. ارفع قالب المغاربة." resetLabel="حذف القالب" />
        <ExportControls posterRef={posterRef} canExport={picked.length > 0} blocked={blocked} onResetDesign={() => updateLayout(DEFAULT_MOROCCAN_LAYOUT)} fileBase={picked.length === 1 ? `choufsport-moroccan-${picked[0].playerId}` : "choufsport-moroccans"} />
        <MoroccanDesign layout={layout} onChange={updateLayout} />
      </section>

      <section className="previewpane" ref={paneRef}>
        <div className="previewsticky">
          <h3 className="muted">معاينة مباشرة</h3>
          <div className={busy ? "previewbox busy" : "previewbox"} style={{ width: previewW, height: layout.height * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <MoroccanPoster ref={posterRef} highlights={onPoster} layout={layout} templateSrc={templateSrc} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
