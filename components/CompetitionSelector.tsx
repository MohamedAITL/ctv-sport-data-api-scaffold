import { STANDINGS_LEAGUES } from "@/config/standingsLeagues";

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
    ? (stale ? "Showing cached data (last refresh failed)" : "Error")
    : loading
    ? "Loading…"
    : stale
    ? "Cached (stale)"
    : "Connected";
  const statusClass = error || stale ? "pill warn" : loading ? "pill" : "pill ok";

  return (
    <div className="card">
      <h3>Competition</h3>
      <label className="field wide">
        <span>League</span>
        <select value={league} onChange={(e) => onLeague(Number(e.target.value))} disabled={loading}>
          {STANDINGS_LEAGUES.map((l) => (
            <option key={l.id} value={l.id}>{l.name} · {l.ar}</option>
          ))}
        </select>
      </label>
      <div className="kv"><span>Season</span><b>{season || "—"}</b></div>
      <div className="kv"><span>Clubs received</span><b>{count}</b></div>
      <div className="kv"><span>Last refresh</span><b>{fetchedAt ? new Date(fetchedAt).toLocaleString() : "—"}</b></div>
      <div className="kv"><span>Status</span><span className={statusClass}>{status}</span></div>
      {error && <p className="err">{error}</p>}
      <button className="btn" disabled={loading} onClick={onRefresh}>
        {loading ? "Refreshing…" : "Refresh standings"}
      </button>
    </div>
  );
}
