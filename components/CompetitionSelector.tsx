import { leaguesByGroup } from "@/config/standingsLeagues";

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
  const status = error
    ? (stale ? "عرض نسخة مخزَّنة (فشل آخر تحديث)" : "خطأ")
    : loading
    ? "جاري التحميل…"
    : stale
    ? "نسخة مخزَّنة"
    : "متصل";
  const statusClass = error || stale ? "pill warn" : loading ? "pill" : "pill ok";

  return (
    <div className="card">
      <h3>المسابقة</h3>
      <label className="field wide">
        <span>البطولة</span>
        <select value={league} onChange={(e) => onLeague(Number(e.target.value))} disabled={loading}>
          {leaguesByGroup().map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.leagues.map((l) => (
                <option key={l.id} value={l.id}>{l.ar}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <div className="kv"><span>الموسم</span><b>{season || "—"}</b></div>
      <div className="kv"><span>عدد الفرق</span><b>{count}</b></div>
      <div className="kv"><span>آخر تحديث</span><b>{fetchedAt ? new Date(fetchedAt).toLocaleString() : "—"}</b></div>
      <div className="kv"><span>الحالة</span><span className={statusClass}>{status}</span></div>
      {error && <p className="err">{error}</p>}
      <button className="btn" disabled={loading} onClick={onRefresh}>
        {loading ? "جاري التحديث…" : "تحديث الترتيب"}
      </button>
    </div>
  );
}
