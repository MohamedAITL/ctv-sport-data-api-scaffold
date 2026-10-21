import type { StatsLayout } from "@/config/statsLayout";

interface Props {
  layout: StatsLayout;
  onChange: (next: StatsLayout) => void;
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

/**
 * Every value the stats poster reads, in one panel — the page used to expose
 * eight of them, so positions, colours and the row card could only be changed
 * by editing the defaults in code.
 */
export default function StatsDesign({ layout, onChange }: Props) {
  const up = (fn: (n: StatsLayout) => void) => {
    const n: StatsLayout = structuredClone(layout);
    fn(n);
    onChange(n);
  };
  const B = layout.rowBg;

  return (
    <details className="card collapsible">
      <summary><h3>التصميم</h3><span className="chev" /></summary>

      <h4>العنوان</h4>
      <div className="grid">
        <Toggle label="إظهار العنوان" value={layout.title.show} onChange={(v) => up((n) => (n.title.show = v))} />
        <Num label="حجم العنوان" value={layout.title.fontSize} onChange={(v) => up((n) => (n.title.fontSize = v))} />
        <Num label="موضع العنوان أفقياً" value={layout.title.x} onChange={(v) => up((n) => (n.title.x = v))} />
        <Num label="موضع العنوان رأسياً" value={layout.title.y} onChange={(v) => up((n) => (n.title.y = v))} />
        <Color label="لون العنوان" value={layout.title.color} onChange={(v) => up((n) => (n.title.color = v))} />
      </div>

      <h4>العنوان الفرعي</h4>
      <div className="grid">
        <Toggle label="إظهار الفرعي" value={layout.subtitle.show} onChange={(v) => up((n) => (n.subtitle.show = v))} />
        <Num label="حجم الفرعي" value={layout.subtitle.fontSize} onChange={(v) => up((n) => (n.subtitle.fontSize = v))} />
        <Num label="موضعه أفقياً" value={layout.subtitle.x} onChange={(v) => up((n) => (n.subtitle.x = v))} />
        <Num label="موضعه رأسياً" value={layout.subtitle.y} onChange={(v) => up((n) => (n.subtitle.y = v))} />
        <Color label="لون الفرعي" value={layout.subtitle.color} onChange={(v) => up((n) => (n.subtitle.color = v))} />
      </div>

      <h4>الصفوف</h4>
      <div className="grid">
        <Num label="عدد الأوائل" value={layout.topN} onChange={(v) => up((n) => (n.topN = Math.max(3, Math.min(20, v || 10))))} />
        <Num label="موضع أول صف" value={layout.firstRowCenterY} onChange={(v) => up((n) => (n.firstRowCenterY = v))} />
        <Num label="ارتفاع الصف" value={layout.rowHeight} onChange={(v) => up((n) => (n.rowHeight = v))} />
        <Num label="نهاية الجدول" value={layout.bottomY} onChange={(v) => up((n) => (n.bottomY = v))} />
        <Num label="أصغر حجم خط" value={layout.minFontSize} onChange={(v) => up((n) => (n.minFontSize = v))} />
      </div>

      <h4>بطاقة الصف</h4>
      <div className="grid">
        <Toggle label="إظهار البطاقة" value={B.show} onChange={(v) => up((n) => (n.rowBg.show = v))} />
        <Num label="ارتفاع البطاقة" value={B.height} onChange={(v) => up((n) => (n.rowBg.height = v))} />
        <Num label="الهامش الجانبي" value={B.insetX} onChange={(v) => up((n) => (n.rowBg.insetX = v))} />
        <Num label="الاستدارة" value={B.radius} onChange={(v) => up((n) => (n.rowBg.radius = v))} />
        <Num label="الشفافية" value={B.opacity} step={0.05} onChange={(v) => up((n) => (n.rowBg.opacity = v))} />
        <Color label="لون البطاقة" value={B.color} onChange={(v) => up((n) => (n.rowBg.color = v))} />
      </div>

      <h4>مواضع الأعمدة</h4>
      <div className="grid">
        <Num label="موضع الترتيب" value={layout.rankX} onChange={(v) => up((n) => (n.rankX = v))} />
        <Num label="موضع الصورة" value={layout.photoX} onChange={(v) => up((n) => (n.photoX = v))} />
        <Num label="حجم الصورة" value={layout.photoSize} onChange={(v) => up((n) => (n.photoSize = v))} />
        <Num label="موضع شعار النادي" value={layout.clubX} onChange={(v) => up((n) => (n.clubX = v))} />
        <Num label="موضع الاسم" value={layout.nameRightX} onChange={(v) => up((n) => (n.nameRightX = v))} />
        <Num label="أقصى عرض للاسم" value={layout.nameMaxWidth} onChange={(v) => up((n) => (n.nameMaxWidth = v))} />
        <Num label="موضع القيمة" value={layout.valueX} onChange={(v) => up((n) => (n.valueX = v))} />
      </div>

      <h4>الخطوط والألوان</h4>
      <div className="grid">
        <Num label="حجم الترتيب" value={layout.rankFontSize} onChange={(v) => up((n) => (n.rankFontSize = v))} />
        <Color label="لون الترتيب" value={layout.rankColor} onChange={(v) => up((n) => (n.rankColor = v))} />
        <Num label="حجم الاسم" value={layout.nameFontSize} onChange={(v) => up((n) => (n.nameFontSize = v))} />
        <Color label="لون الاسم" value={layout.nameColor} onChange={(v) => up((n) => (n.nameColor = v))} />
        <Num label="حجم القيمة" value={layout.valueFontSize} onChange={(v) => up((n) => (n.valueFontSize = v))} />
        <Color label="لون القيمة" value={layout.valueColor} onChange={(v) => up((n) => (n.valueColor = v))} />
        <Color label="لون الثلاثة الأوائل" value={layout.topColor} onChange={(v) => up((n) => (n.topColor = v))} />
      </div>

      <h4>السطر الإضافي</h4>
      <div className="grid">
        <Toggle label="إظهار السطر الإضافي" value={layout.showSecondary} onChange={(v) => up((n) => (n.showSecondary = v))} />
        <Num label="حجمه" value={layout.secondaryFontSize} onChange={(v) => up((n) => (n.secondaryFontSize = v))} />
        <Color label="لونه" value={layout.secondaryColor} onChange={(v) => up((n) => (n.secondaryColor = v))} />
      </div>
    </details>
  );
}
