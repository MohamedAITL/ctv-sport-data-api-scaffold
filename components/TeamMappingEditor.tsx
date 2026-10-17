import { useRef } from "react";
import type { TeamRow } from "@/types/standings";
import { fileToDataUrl } from "@/lib/file";

interface Props {
  rows: TeamRow[];
  nameOverrides: Record<string, string>;
  logoOverrides: Record<string, string>;
  onName: (teamId: string, value: string) => void;
  onLogo: (teamId: string, dataUrl: string) => void;
  onClearLogo: (teamId: string) => void;
}

// Edit Arabic display names and upload logo overrides, keyed by stable teamId.
// Official API logos stay unless you upload a replacement for a specific club;
// "Revert" drops the override and restores that club's official logo. API stats
// (position/played/wins/points) are shown read-only — never changed here.
export default function TeamMappingEditor({
  rows,
  nameOverrides,
  logoOverrides,
  onName,
  onLogo,
  onClearLogo,
}: Props) {
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function pick(teamId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onLogo(teamId, await fileToDataUrl(file));
    e.target.value = "";
  }

  return (
    <details className="card collapsible" open>
      <summary><h3>Teams — Arabic names & logos</h3><span className="chev" /></summary>
      <p className="muted">
        Upload a logo from your computer to fix a wrong crest — every other club keeps its
        official logo, and <b>Revert</b> restores the official one. Name &amp; logo edits are
        saved locally and survive refresh. Stats are read-only API values.
      </p>
      <div className="teamlist">
        {rows.map((r) => {
          const custom = r.teamId in logoOverrides;
          const logo = logoOverrides[r.teamId] || r.logo;
          const nameEdited = r.teamId in nameOverrides;
          return (
            <div className="teamrow" key={r.teamId || r.rank}>
              <span className="rank">{r.rank}</span>
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="logo" src={logo} alt="" width={28} height={28} title={custom ? "custom logo" : "official logo"} />
              ) : (
                <span className="logo fallback" title="no official logo — upload one">{(r.nameOriginal || "?").charAt(0)}</span>
              )}
              <input
                className="namein"
                dir="rtl"
                value={nameOverrides[r.teamId] ?? r.nameAr}
                title={r.nameOriginal}
                onChange={(e) => onName(r.teamId, e.target.value)}
              />
              <span className="stats" title="played / wins / points">{r.played} · {r.wins} · {r.points}</span>
              <button className="btn tiny" onClick={() => fileInputs.current[r.teamId]?.click()}>
                {custom ? "Change logo" : "Upload logo"}
              </button>
              {custom && (
                <button className="btn tiny ghost" title="restore official logo" onClick={() => onClearLogo(r.teamId)}>
                  Revert
                </button>
              )}
              {nameEdited && <span className="edited" title="manual name override">•</span>}
              <input
                ref={(el) => { fileInputs.current[r.teamId] = el; }}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                hidden
                onChange={(e) => pick(r.teamId, e)}
              />
            </div>
          );
        })}
      </div>
    </details>
  );
}
