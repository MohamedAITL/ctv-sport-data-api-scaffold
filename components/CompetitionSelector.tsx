import { leaguesByGroup, leagueById } from "@/config/standingsLeagues";
import { useLang } from "@/lib/prefs";

interface Props {
  league: number;
  onLeague: (id: number) => void;
  season?: string | null;
  count: number;
  fetchedAt?: string;
  stale: boolean;
  error?: string | null;
  loading: boolean;
  onRefresh: () => void;
}

// League picker + season + connection status + last fetch + club count + Refresh.
export default function CompetitionSelector({
  league,
  onLeague,
  season,
  count,
  fetchedAt,
  stale,
  error,
  loading,
  onRefresh,
}: Props) {
  const { t } = useLang();
  const status = error
    ? (stale ? t("عرض نسخة مخزَّنة (فشل آخر تحديث)", "Showing a saved copy (last refresh failed)") : t("خطأ", "Error"))
    : loading
    ? t("جاري التحميل…", "Loading…")
    : stale
    ? t("نسخة مخزَّنة", "Saved copy")
    : t("متصل", "Connected");
  const statusClass = error || stale ? "pill warn" : loading ? "pill" : "pill ok";

  return (
    <div className="card">
      <h3>{t("المسابقة")}</h3>
      <label className="field wide">
        <span>{t("البطولة")}</span>
        <select value={league} onChange={(e) => onLeague(Number(e.target.value))} disabled={loading}>
          {leaguesByGroup().map((g) => (
            <optgroup key={g.group} label={t(g.group)}>
              {g.leagues.map((l) => (
                <option key={l.id} value={l.id}>{(leagueById(l.id)?.ar ?? "")}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <div className="kv"><span>{t("الموسم")}</span><b>{season || "—"}</b></div>
      <div className="kv"><span>{t("عدد الفرق")}</span><b>{count}</b></div>
      <div className="kv"><span>{t("آخر تحديث")}</span><b>{fetchedAt ? new Date(fetchedAt).toLocaleString() : "—"}</b></div>
      <div className="kv"><span>{t("الحالة")}</span><span className={statusClass}>{status}</span></div>
      {error && <p className="err">{error}</p>}
      <button className="btn" disabled={loading} onClick={onRefresh}>
        {loading ? t("جاري التحديث…", "Refreshing…") : t("تحديث الترتيب", "Refresh standings")}
      </button>
    </div>
  );
}
