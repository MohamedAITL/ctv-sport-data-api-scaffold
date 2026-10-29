import { useRef } from "react";
import type { Match } from "@/types/fixtures";
import { fileToDataUrl } from "@/lib/file";
import { useLang } from "@/lib/prefs";

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
  const { t } = useLang();
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const seen = new Set<string>();
  const teams = matches.flatMap((m) => [m.home, m.away]).filter((team) => team.id && !seen.has(team.id) && seen.add(team.id));

  async function pick(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onLogo(id, await fileToDataUrl(f));
    e.target.value = "";
  }

  return (
    <details className="card collapsible" open>
      <summary><h3>{t("الفرق — الأسماء والشعارات")}</h3><span className="chev" /></summary>
      <p className="muted">{t("تُحفظ التعديلات وتُستخدم أيضاً في محرر الترتيب (نفس الفريق).")}</p>
      <div className="teamlist">
        {teams.map((team) => {
          const badge = logoOverrides[team.id] || team.badge;
          return (
            <div className="teamrow" key={team.id}>
              {badge ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="logo" src={badge} alt="" width={26} height={26} style={{ objectFit: "contain", background: "transparent" }} />
              ) : (
                <span className="logo fallback">{(team.name || "?").charAt(0)}</span>
              )}
              <input className="namein" dir="auto" value={nameOverrides[team.id] ?? team.nameAr} title={team.name} onChange={(e) => onName(team.id, e.target.value)} />
              <button className="btn tiny" onClick={() => inputs.current[team.id]?.click()}>{logoOverrides[team.id] ? t("تغيير", "Change") : t("رفع", "Upload")}</button>
              {logoOverrides[team.id] && <button className="btn tiny ghost" onClick={() => onClearLogo(team.id)}>{t("تراجع")}</button>}
              <input ref={(el) => { inputs.current[team.id] = el; }} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden onChange={(e) => pick(team.id, e)} />
            </div>
          );
        })}
      </div>
    </details>
  );
}
