import type { LiveMatch } from "@/types/live";

interface Props {
  matches: LiveMatch[];
  selectedId: number | null;
  onSelect: (m: LiveMatch) => void;
}

// Left rail. Rows are full-width tap targets — on a wall screen a finger is the
// only pointer, so there is no hover state to lean on.
export default function LiveList({ matches, selectedId, onSelect }: Props) {
  return (
    <div className="kl-list" dir="rtl">
      {matches.map((m) => (
        <button
          key={m.id}
          type="button"
          className={m.id === selectedId ? "kl-row on" : "kl-row"}
          onClick={() => onSelect(m)}
        >
          <div className="kl-row-top">
            <span className="kl-comp">{m.competition}</span>
            {m.isLive ? (
              <span className="kl-live"><i className="kl-dot" />{m.clock || "مباشر"}</span>
            ) : (
              <span className="kl-when">{m.isFinished ? "انتهت" : m.startTime.slice(11, 16)}</span>
            )}
          </div>
          <div className="kl-team">
            {m.home.logo && /* eslint-disable-next-line @next/next/no-img-element */
              <img src={m.home.logo} alt="" />}
            <span className="kl-name">{m.home.name}</span>
            <span className="kl-score">{m.home.score ?? "-"}</span>
          </div>
          <div className="kl-team">
            {m.away.logo && /* eslint-disable-next-line @next/next/no-img-element */
              <img src={m.away.logo} alt="" />}
            <span className="kl-name">{m.away.name}</span>
            <span className="kl-score">{m.away.score ?? "-"}</span>
          </div>
        </button>
      ))}
      {matches.length === 0 && <p className="kl-empty">لا توجد مباريات</p>}
    </div>
  );
}
