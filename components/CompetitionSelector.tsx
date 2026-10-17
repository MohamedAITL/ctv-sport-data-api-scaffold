interface Props {
  leagueName?: string;
  season?: string | null;
  count: number;
  fetchedAt?: string;
  stale: boolean;
  error?: string | null;
  loading: boolean;
  onRefresh: () => void;
}

// Competition + season + connection status + last fetch + club count + Refresh.
// (Single current season per the live API, so no season dropdown — see README.)
export default function CompetitionSelector({
  leagueName,
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
      <div className="kv"><span>League</span><b>{leagueName || "Botola Pro (Morocco)"}</b></div>
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
