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
      <summary><h3>التصميم</h3><span className="chev" /></summary>

      <h4>الصفوف</h4>
      <div className="grid">
        <Num label="موضع أول صف" value={T.firstRowCenterY} onChange={(v) => up((n) => (n.table.firstRowCenterY = v))} />
        <Num label="ارتفاع الصف" value={T.rowHeight} step={0.5} onChange={(v) => up((n) => (n.table.rowHeight = v))} />
        <Num label="حجم الاسم" value={T.fontSizeName} onChange={(v) => up((n) => (n.table.fontSizeName = v))} />
        <Num label="حجم الأرقام" value={T.fontSizeStat} onChange={(v) => up((n) => (n.table.fontSizeStat = v))} />
        <Num label="حجم الترتيب" value={T.fontSizeRank} onChange={(v) => up((n) => (n.table.fontSizeRank = v))} />
        <Num label="حجم الشعار" value={T.logoSize} onChange={(v) => up((n) => (n.table.logoSize = v))} />
        <Color label="لون الاسم" value={T.nameColor} onChange={(v) => up((n) => (n.table.nameColor = v))} />
      </div>

      <h4>مواضع الأعمدة</h4>
      <div className="grid">
        <Num label="موضع النقاط" value={T.pointsX} onChange={(v) => up((n) => (n.table.pointsX = v))} />
        <Num label="موضع «فاز»" value={T.winsX} onChange={(v) => up((n) => (n.table.winsX = v))} />
        <Num label="موضع «لعب»" value={T.playedX} onChange={(v) => up((n) => (n.table.playedX = v))} />
        <Num label="موضع الاسم" value={T.nameRightX} onChange={(v) => up((n) => (n.table.nameRightX = v))} />
        <Num label="موضع الشعار" value={T.logoCenterX} onChange={(v) => up((n) => (n.table.logoCenterX = v))} />
        <Num label="موضع الترتيب" value={T.rankX} onChange={(v) => up((n) => (n.table.rankX = v))} />
      </div>

      <h4>ألوان المناطق</h4>
      <div className="grid">
        <Num label="عدد الأعلى" value={Z.topCount} onChange={(v) => up((n) => (n.zones.topCount = v))} />
        <Num label="عدد الأسفل" value={Z.bottomCount} onChange={(v) => up((n) => (n.zones.bottomCount = v))} />
        <Color label="الأعلى" value={Z.topColor} onChange={(v) => up((n) => (n.zones.topColor = v))} />
        <Color label="الوسط" value={Z.midColor} onChange={(v) => up((n) => (n.zones.midColor = v))} />
        <Color label="الأسفل" value={Z.bottomColor} onChange={(v) => up((n) => (n.zones.bottomColor = v))} />
      </div>

      <h4>تغطية الصفوف القديمة</h4>
      <div className="grid">
        <Num label="X" value={M.x} onChange={(v) => up((n) => (n.mask.x = v))} />
        <Num label="Y" value={M.y} onChange={(v) => up((n) => (n.mask.y = v))} />
        <Num label="العرض" value={M.w} onChange={(v) => up((n) => (n.mask.w = v))} />
        <Num label="الارتفاع" value={M.h} onChange={(v) => up((n) => (n.mask.h = v))} />
        <Num label="الاستدارة" value={M.radius} onChange={(v) => up((n) => (n.mask.radius = v))} />
        <Num label="الشفافية" value={M.opacity} step={0.02} onChange={(v) => up((n) => (n.mask.opacity = v))} />
        <Color label="اللون" value={M.color} onChange={(v) => up((n) => (n.mask.color = v))} />
      </div>

      <h4>عناصر إضافية (أطفئها للإبقاء على نص القالب)</h4>
      <div className="grid">
        <Toggle label="العنوان" value={layout.heading.show} onChange={(v) => up((n) => (n.heading.show = v))} />
        <Toggle label="عناوين الأعمدة" value={layout.columnHeaders.show} onChange={(v) => up((n) => (n.columnHeaders.show = v))} />
        <Toggle label="سطر الموسم" value={layout.seasonLabel.show} onChange={(v) => up((n) => (n.seasonLabel.show = v))} />
        <Toggle label="سطر التحديث" value={layout.updatedLabel.show} onChange={(v) => up((n) => (n.updatedLabel.show = v))} /> <Toggle label="تغطية الصفوف" value={layout.mask.show} onChange={(v) => up((n) => (n.mask.show = v))} />
      </div>
      {layout.heading.show && (
        <div className="grid">
          <Text label="نص العنوان" rtl value={layout.heading.text || ""} onChange={(v) => up((n) => (n.heading.text = v))} />
          <Num label="حجم العنوان" value={layout.heading.fontSize} onChange={(v) => up((n) => (n.heading.fontSize = v))} />
        </div>
      )}
      {layout.seasonLabel.show && (
        <Text label="نص الموسم" rtl value={layout.seasonLabel.text || ""} onChange={(v) => up((n) => (n.seasonLabel.text = v))} />
      )}
      {layout.updatedLabel.show && (
        <Text label="نص التحديث" rtl value={layout.updatedLabel.text || ""} onChange={(v) => up((n) => (n.updatedLabel.text = v))} />
      )}
    </details>
  );
}
