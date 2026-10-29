// The inputs every live poster's design panel is built from, so the
// head-to-head and lineup panels look and behave the same.

export function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={value} step={step} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
export function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="field check">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
export function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field wide">
      <span>{label}</span>
      <input type="text" dir="auto" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
