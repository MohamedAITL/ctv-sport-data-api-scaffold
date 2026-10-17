import { useRef } from "react";
import type { Match } from "@/types/fixtures";
import { fileToDataUrl } from "@/lib/file";

interface Props {
  matches: Match[];
  nameOverrides: Record<string, string>;
  logoOverrides: Record<string, string>;
  onName: (teamId: string, value: string) => void;
  onLogo: (teamId: string, dataUrl: string) => void;
  onClearLogo: (teamId: string) => void;
}

// Edit the Arabic name / badge of any team in the selected matches, keyed by
// stable teamId (shared with the standings editor). Official badges kept unless
// you upload a replacement.
export default function MatchdayTeams({ matches, nameOverrides, logoOverrides, onName, onLogo, onClearLogo }: Props) {
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const seen = new Set<string>();
  const teams = matches.flatMap((m) => [m.home, m.away]).filter((t) => t.id && !seen.has(t.id) && seen.add(t.id));

  async function pick(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onLogo(id, await fileToDataUrl(f));
    e.target.value = "";
  }

  return (
    <details className="card collapsible" open>
      <summary><h3>Teams — Arabic names & badges</h3><span className="chev" /></summary>
      <p className="muted">Edits persist and are shared with the standings editor (same teamId).</p>
      <div className="teamlist">
        {teams.map((t) => {
          const badge = logoOverrides[t.id] || t.badge;
          return (
            <div className="teamrow" key={t.id}>
              {badge ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="logo" src={badge} alt="" width={26} height={26} style={{ objectFit: "contain", background: "transparent" }} />
              ) : (
                <span className="logo fallback">{(t.name || "?").charAt(0)}</span>
              )}
              <input className="namein" dir="rtl" value={nameOverrides[t.id] ?? t.nameAr} title={t.name} onChange={(e) => onName(t.id, e.target.value)} />
              <button className="btn tiny" onClick={() => inputs.current[t.id]?.click()}>{logoOverrides[t.id] ? "Change" : "Upload"}</button>
              {logoOverrides[t.id] && <button className="btn tiny ghost" onClick={() => onClearLogo(t.id)}>Revert</button>}
              <input ref={(el) => { inputs.current[t.id] = el; }} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden onChange={(e) => pick(t.id, e)} />
            </div>
          );
        })}
      </div>
    </details>
  );
}
