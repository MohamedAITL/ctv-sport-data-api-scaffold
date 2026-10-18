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
    <details className="card collapsible">
      <summary><h3>Design</h3><span className="chev" /></summary>
      <h4>Overlays (turn off when your template has them)</h4>
      <div className="grid">
        <Toggle label="Title" value={L.title.show} onChange={(v) => up((n) => (n.title.show = v))} />
        <Toggle label="Results title" value={L.resultsTitle.show} onChange={(v) => up((n) => (n.resultsTitle.show = v))} />
        <Toggle label="Date label" value={L.dateLabel.show} onChange={(v) => up((n) => (n.dateLabel.show = v))} />
        <Toggle label="Row cards" value={L.rowBg.show} onChange={(v) => up((n) => (n.rowBg.show = v))} />
      </div>
      {L.title.show && (
        <div className="grid">
          <Text label="Title text" value={L.title.text || ""} onChange={(v) => up((n) => (n.title.text = v))} />
          <Num label="Title size" value={L.title.fontSize} onChange={(v) => up((n) => (n.title.fontSize = v))} />
          <Num label="Title Y" value={L.title.y} onChange={(v) => up((n) => (n.title.y = v))} />
          <Color label="Title color" value={L.title.color} onChange={(v) => up((n) => (n.title.color = v))} />
        </div>
      )}
      {L.resultsTitle.show && (
        <div className="grid">
          <Text label="Results title text" value={L.resultsTitle.text || ""} onChange={(v) => up((n) => (n.resultsTitle.text = v))} />
          <Num label="Results title size" value={L.resultsTitle.fontSize} onChange={(v) => up((n) => (n.resultsTitle.fontSize = v))} />
          <Num label="Results title Y" value={L.resultsTitle.y} onChange={(v) => up((n) => (n.resultsTitle.y = v))} />
          <Color label="Results title color" value={L.resultsTitle.color} onChange={(v) => up((n) => (n.resultsTitle.color = v))} />
        </div>
      )}
      <h4>Competition headers</h4>
      <div className="grid">
        <Toggle label="Show headers" value={L.groupHeader.show} onChange={(v) => up((n) => (n.groupHeader.show = v))} />
        <Num label="Header size" value={L.groupHeader.fontSize} onChange={(v) => up((n) => (n.groupHeader.fontSize = v))} />
        <Num label="Header logo" value={L.groupHeader.logoSize} onChange={(v) => up((n) => (n.groupHeader.logoSize = v))} />
        <Color label="Header color" value={L.groupHeader.color} onChange={(v) => up((n) => (n.groupHeader.color = v))} />
        <Num label="Group gap" value={L.groupGap} onChange={(v) => up((n) => (n.groupGap = v))} />
        <Num label="Headers up/down" value={L.groupHeader.dy} onChange={(v) => up((n) => (n.groupHeader.dy = v))} />
      </div>

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
        <Color label="Row card color" value={L.rowBg.color} onChange={(v) => up((n) => (n.rowBg.color = v))} />
      </div>
      <h4>Columns (X)</h4>
      <div className="grid">
        <Num label="Home badge X" value={L.homeBadgeX} onChange={(v) => up((n) => (n.homeBadgeX = v))} />
        <Num label="Home name X" value={L.homeNameRightX} onChange={(v) => up((n) => (n.homeNameRightX = v))} />
        <Num label="Center X" value={L.centerX} onChange={(v) => up((n) => (n.centerX = v))} />
        <Num label="Away badge X" value={L.awayBadgeX} onChange={(v) => up((n) => (n.awayBadgeX = v))} />
        <Num label="Away name X" value={L.awayNameLeftX} onChange={(v) => up((n) => (n.awayNameLeftX = v))} />
      </div>
    </details>
  );
}
