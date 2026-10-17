import type { MatchdayLayout } from "@/config/matchdayLayout";

interface Props { layout: MatchdayLayout; onChange: (n: MatchdayLayout) => void }

function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return <label className="field"><span>{label}</span><input type="number" value={value} step={step} onChange={(e) => onChange(Number(e.target.value))} /></label>;
}
function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="field"><span>{label}</span><input type="color" value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <label className="field check"><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /><span>{label}</span></label>;
}
function Text({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="field wide"><span>{label}</span><input type="text" dir="rtl" value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

export default function MatchdayDesign({ layout, onChange }: Props) {
  const up = (fn: (n: MatchdayLayout) => void) => { const n = structuredClone(layout); fn(n); onChange(n); };
  const L = layout;
  return (
    <div className="card">
      <h3>Design</h3>
      <h4>Overlays (turn off when your template has them)</h4>
      <div className="grid">
        <Toggle label="Title" value={L.title.show} onChange={(v) => up((n) => (n.title.show = v))} />
        <Toggle label="Date label" value={L.dateLabel.show} onChange={(v) => up((n) => (n.dateLabel.show = v))} />
        <Toggle label="Row cards" value={L.rowBg.show} onChange={(v) => up((n) => (n.rowBg.show = v))} />
        <Toggle label="League logos" value={L.leagueLogo.show} onChange={(v) => up((n) => (n.leagueLogo.show = v))} />
      </div>
      {L.title.show && (
        <div className="grid">
          <Text label="Title text" value={L.title.text || ""} onChange={(v) => up((n) => (n.title.text = v))} />
          <Num label="Title size" value={L.title.fontSize} onChange={(v) => up((n) => (n.title.fontSize = v))} />
          <Num label="Title Y" value={L.title.y} onChange={(v) => up((n) => (n.title.y = v))} />
          <Color label="Title color" value={L.title.color} onChange={(v) => up((n) => (n.title.color = v))} />
        </div>
      )}
      <h4>Rows</h4>
      <div className="grid">
        <Num label="First row Y" value={L.firstRowCenterY} onChange={(v) => up((n) => (n.firstRowCenterY = v))} />
        <Num label="Row height" value={L.rowHeight} step={0.5} onChange={(v) => up((n) => (n.rowHeight = v))} />
        <Num label="Badge size" value={L.badgeSize} onChange={(v) => up((n) => (n.badgeSize = v))} />
        <Num label="Name size" value={L.nameFontSize} onChange={(v) => up((n) => (n.nameFontSize = v))} />
        <Num label="Name max W" value={L.nameMaxWidth} onChange={(v) => up((n) => (n.nameMaxWidth = v))} />
        <Num label="Center size" value={L.centerFontSize} onChange={(v) => up((n) => (n.centerFontSize = v))} />
        <Color label="Name color" value={L.nameColor} onChange={(v) => up((n) => (n.nameColor = v))} />
        <Color label="Center color" value={L.centerColor} onChange={(v) => up((n) => (n.centerColor = v))} />
        <Num label="Row card opacity" value={L.rowBg.opacity} step={0.02} onChange={(v) => up((n) => (n.rowBg.opacity = v))} />
      </div>
      <h4>Columns (X)</h4>
      <div className="grid">
        <Num label="Home badge X" value={L.homeBadgeX} onChange={(v) => up((n) => (n.homeBadgeX = v))} />
        <Num label="Home name X" value={L.homeNameRightX} onChange={(v) => up((n) => (n.homeNameRightX = v))} />
        <Num label="Center X" value={L.centerX} onChange={(v) => up((n) => (n.centerX = v))} />
        <Num label="Away badge X" value={L.awayBadgeX} onChange={(v) => up((n) => (n.awayBadgeX = v))} />
        <Num label="Away name X" value={L.awayNameLeftX} onChange={(v) => up((n) => (n.awayNameLeftX = v))} />
        <Num label="League logo size" value={L.leagueLogo.size} onChange={(v) => up((n) => (n.leagueLogo.size = v))} />
      </div>
    </div>
  );
}
