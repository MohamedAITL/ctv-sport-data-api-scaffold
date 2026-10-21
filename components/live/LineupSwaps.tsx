import type { LineupPlayer, TeamLineup } from "@/types/live";

/** Starter slot (`h123` / `a456`) → the substitute who takes it. */
export type Swaps = Record<string, number>;

const label = (p: LineupPlayer) => `${p.number ?? ""} ${p.shortName || p.name}`.trim();

/**
 * The XI with the chosen substitutes in it. A substitute takes the starter's
 * spot on the pitch — the slot is the position, the player is who fills it. A
 * swap naming someone no longer on the bench is ignored.
 */
export function withSwaps(lu: TeamLineup, tag: "h" | "a", swaps: Swaps): TeamLineup {
  return {
    ...lu,
    starting: lu.starting.map((s) => {
      const sub = lu.bench.find((b) => b.id === swaps[`${tag}${s.id}`]);
      return sub ? { ...sub, line: s.line, side: s.side } : s;
    }),
  };
}

/** One select per starting slot: keep the starter, or put a substitute in. */
export default function LineupSwaps({ title, tag, lineup, swaps, onChange }: {
  title: string; tag: "h" | "a"; lineup: TeamLineup; swaps: Swaps; onChange: (next: Swaps) => void;
}) {
  // A substitute already sent on in another slot is not offered twice.
  const taken = new Set(Object.entries(swaps).filter(([k]) => k.startsWith(tag)).map(([, id]) => id));
  return (
    <>
      <h4>{title}</h4>
      <div className="kxs">
        {lineup.starting.map((s) => {
          const slot = `${tag}${s.id}`;
          const current = swaps[slot] ?? s.id;
          return (
            <label key={slot} className={`field wide${current !== s.id ? " kxs-on" : ""}`}>
              <span>{s.position ?? ""}</span>
              <select
                value={current}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const next = { ...swaps };
                  if (id === s.id) delete next[slot]; else next[slot] = id;
                  onChange(next);
                }}
              >
                <option value={s.id}>{label(s)}</option>
                {lineup.bench
                  .filter((b) => b.id === current || !taken.has(b.id))
                  .map((b) => <option key={b.id} value={b.id}>{label(b)} — احتياط</option>)}
              </select>
            </label>
          );
        })}
      </div>
    </>
  );
}
