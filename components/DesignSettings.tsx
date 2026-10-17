import type { LayoutConfig } from "@/config/defaultLayout";

interface Props {
  layout: LayoutConfig;
  onChange: (next: LayoutConfig) => void;
}

function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={value} step={step} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="field check">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
function Text({ label, value, onChange, rtl }: { label: string; value: string; onChange: (v: string) => void; rtl?: boolean }) {
  return (
    <label className="field wide">
      <span>{label}</span>
      <input type="text" dir={rtl ? "rtl" : "ltr"} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

// Live layout controls. All values write back into LayoutConfig and persist.
export default function DesignSettings({ layout, onChange }: Props) {
  const up = (fn: (n: LayoutConfig) => void) => {
    const n: LayoutConfig = structuredClone(layout);
    fn(n);
    onChange(n);
  };
  const T = layout.table;
  const Z = layout.zones;
  const M = layout.mask;

  return (
    <details className="card collapsible">
      <summary><h3>Design</h3><span className="chev" /></summary>

      <h4>Rows</h4>
      <div className="grid">
        <Num label="First row Y" value={T.firstRowCenterY} onChange={(v) => up((n) => (n.table.firstRowCenterY = v))} />
        <Num label="Row height" value={T.rowHeight} step={0.5} onChange={(v) => up((n) => (n.table.rowHeight = v))} />
        <Num label="Name size" value={T.fontSizeName} onChange={(v) => up((n) => (n.table.fontSizeName = v))} />
        <Num label="Stat size" value={T.fontSizeStat} onChange={(v) => up((n) => (n.table.fontSizeStat = v))} />
        <Num label="Rank size" value={T.fontSizeRank} onChange={(v) => up((n) => (n.table.fontSizeRank = v))} />
        <Num label="Logo size" value={T.logoSize} onChange={(v) => up((n) => (n.table.logoSize = v))} />
        <Color label="Name color" value={T.nameColor} onChange={(v) => up((n) => (n.table.nameColor = v))} />
      </div>

      <h4>Columns (X)</h4>
      <div className="grid">
        <Num label="Points X" value={T.pointsX} onChange={(v) => up((n) => (n.table.pointsX = v))} />
        <Num label="Wins X" value={T.winsX} onChange={(v) => up((n) => (n.table.winsX = v))} />
        <Num label="Played X" value={T.playedX} onChange={(v) => up((n) => (n.table.playedX = v))} />
        <Num label="Name right X" value={T.nameRightX} onChange={(v) => up((n) => (n.table.nameRightX = v))} />
        <Num label="Logo X" value={T.logoCenterX} onChange={(v) => up((n) => (n.table.logoCenterX = v))} />
        <Num label="Rank X" value={T.rankX} onChange={(v) => up((n) => (n.table.rankX = v))} />
      </div>

      <h4>Zone colors</h4>
      <div className="grid">
        <Num label="Top count" value={Z.topCount} onChange={(v) => up((n) => (n.zones.topCount = v))} />
        <Num label="Bottom count" value={Z.bottomCount} onChange={(v) => up((n) => (n.zones.bottomCount = v))} />
        <Color label="Top" value={Z.topColor} onChange={(v) => up((n) => (n.zones.topColor = v))} />
        <Color label="Mid" value={Z.midColor} onChange={(v) => up((n) => (n.zones.midColor = v))} />
        <Color label="Bottom" value={Z.bottomColor} onChange={(v) => up((n) => (n.zones.bottomColor = v))} />
      </div>

      <h4>Mask (covers old rows)</h4>
      <div className="grid">
        <Num label="X" value={M.x} onChange={(v) => up((n) => (n.mask.x = v))} />
        <Num label="Y" value={M.y} onChange={(v) => up((n) => (n.mask.y = v))} />
        <Num label="Width" value={M.w} onChange={(v) => up((n) => (n.mask.w = v))} />
        <Num label="Height" value={M.h} onChange={(v) => up((n) => (n.mask.h = v))} />
        <Num label="Radius" value={M.radius} onChange={(v) => up((n) => (n.mask.radius = v))} />
        <Num label="Opacity" value={M.opacity} step={0.02} onChange={(v) => up((n) => (n.mask.opacity = v))} />
        <Color label="Color" value={M.color} onChange={(v) => up((n) => (n.mask.color = v))} />
      </div>

      <h4>Overlays (optional — off keeps the template text)</h4>
      <div className="grid">
        <Toggle label="Heading" value={layout.heading.show} onChange={(v) => up((n) => (n.heading.show = v))} />
        <Toggle label="Column headers" value={layout.columnHeaders.show} onChange={(v) => up((n) => (n.columnHeaders.show = v))} />
        <Toggle label="Season label" value={layout.seasonLabel.show} onChange={(v) => up((n) => (n.seasonLabel.show = v))} />
        <Toggle label="Updated label" value={layout.updatedLabel.show} onChange={(v) => up((n) => (n.updatedLabel.show = v))} /> <Toggle label="Row mask" value={layout.mask.show} onChange={(v) => up((n) => (n.mask.show = v))} />
      </div>
      {layout.heading.show && (
        <div className="grid">
          <Text label="Heading text" rtl value={layout.heading.text || ""} onChange={(v) => up((n) => (n.heading.text = v))} />
          <Num label="Heading size" value={layout.heading.fontSize} onChange={(v) => up((n) => (n.heading.fontSize = v))} />
        </div>
      )}
      {layout.seasonLabel.show && (
        <Text label="Season text" rtl value={layout.seasonLabel.text || ""} onChange={(v) => up((n) => (n.seasonLabel.text = v))} />
      )}
      {layout.updatedLabel.show && (
        <Text label="Updated text" rtl value={layout.updatedLabel.text || ""} onChange={(v) => up((n) => (n.updatedLabel.text = v))} />
      )}
    </details>
  );
}
