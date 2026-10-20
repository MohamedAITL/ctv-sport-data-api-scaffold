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
      <summary><h3>التصميم</h3><span className="chev" /></summary>
      <h4>عناصر إضافية (أطفئها إذا كان القالب يحتويها)</h4>
      <div className="grid">
        <Toggle label="العنوان" value={L.title.show} onChange={(v) => up((n) => (n.title.show = v))} />
        <Toggle label="عنوان النتائج" value={L.resultsTitle.show} onChange={(v) => up((n) => (n.resultsTitle.show = v))} />
        <Toggle label="سطر التاريخ" value={L.dateLabel.show} onChange={(v) => up((n) => (n.dateLabel.show = v))} />
        <Toggle label="بطاقات الصفوف" value={L.rowBg.show} onChange={(v) => up((n) => (n.rowBg.show = v))} />
      </div>
      {L.title.show && (
        <div className="grid">
          <Text label="نص العنوان" value={L.title.text || ""} onChange={(v) => up((n) => (n.title.text = v))} />
          <Num label="حجم العنوان" value={L.title.fontSize} onChange={(v) => up((n) => (n.title.fontSize = v))} />
          <Num label="موضع العنوان" value={L.title.y} onChange={(v) => up((n) => (n.title.y = v))} />
          <Color label="لون العنوان" value={L.title.color} onChange={(v) => up((n) => (n.title.color = v))} />
        </div>
      )}
      {L.resultsTitle.show && (
        <div className="grid">
          <Text label="نص عنوان النتائج" value={L.resultsTitle.text || ""} onChange={(v) => up((n) => (n.resultsTitle.text = v))} />
          <Num label="حجم عنوان النتائج" value={L.resultsTitle.fontSize} onChange={(v) => up((n) => (n.resultsTitle.fontSize = v))} />
          <Num label="موضع عنوان النتائج" value={L.resultsTitle.y} onChange={(v) => up((n) => (n.resultsTitle.y = v))} />
          <Color label="لون عنوان النتائج" value={L.resultsTitle.color} onChange={(v) => up((n) => (n.resultsTitle.color = v))} />
        </div>
      )}
      <h4>عناوين المسابقات</h4>
      <div className="grid">
        <Toggle label="إظهار العناوين" value={L.groupHeader.show} onChange={(v) => up((n) => (n.groupHeader.show = v))} />
        <Num label="حجم العنوان" value={L.groupHeader.fontSize} onChange={(v) => up((n) => (n.groupHeader.fontSize = v))} />
        <Num label="شعار المسابقة" value={L.groupHeader.logoSize} onChange={(v) => up((n) => (n.groupHeader.logoSize = v))} />
        <Color label="لون العنوان" value={L.groupHeader.color} onChange={(v) => up((n) => (n.groupHeader.color = v))} />
        <Num label="المسافة بين المجموعات" value={L.groupGap} onChange={(v) => up((n) => (n.groupGap = v))} />
        <Num label="موضع العناوين رأسياً" value={L.groupHeader.dy} onChange={(v) => up((n) => (n.groupHeader.dy = v))} />
      </div>

      <h4>الصفوف</h4>
      <div className="grid">
        <Num label="موضع أول صف" value={L.firstRowCenterY} onChange={(v) => up((n) => (n.firstRowCenterY = v))} />
        <Num label="ارتفاع الصف" value={L.rowHeight} step={0.5} onChange={(v) => up((n) => (n.rowHeight = v))} />
        <Num label="حجم الشعار" value={L.badgeSize} onChange={(v) => up((n) => (n.badgeSize = v))} />
        <Num label="حجم الاسم" value={L.nameFontSize} onChange={(v) => up((n) => (n.nameFontSize = v))} />
        <Num label="أقصى عرض للاسم" value={L.nameMaxWidth} onChange={(v) => up((n) => (n.nameMaxWidth = v))} />
        <Num label="حجم الوسط" value={L.centerFontSize} onChange={(v) => up((n) => (n.centerFontSize = v))} />
        <Color label="لون الاسم" value={L.nameColor} onChange={(v) => up((n) => (n.nameColor = v))} />
        <Color label="لون الوسط" value={L.centerColor} onChange={(v) => up((n) => (n.centerColor = v))} />
        <Num label="شفافية البطاقة" value={L.rowBg.opacity} step={0.02} onChange={(v) => up((n) => (n.rowBg.opacity = v))} />
        <Color label="لون البطاقة" value={L.rowBg.color} onChange={(v) => up((n) => (n.rowBg.color = v))} />
      </div>
      <h4>مواضع الأعمدة</h4>
      <div className="grid">
        <Num label="موضع شعار المضيف" value={L.homeBadgeX} onChange={(v) => up((n) => (n.homeBadgeX = v))} />
        <Num label="موضع اسم المضيف" value={L.homeNameRightX} onChange={(v) => up((n) => (n.homeNameRightX = v))} />
        <Num label="موضع الوسط" value={L.centerX} onChange={(v) => up((n) => (n.centerX = v))} />
        <Num label="موضع شعار الضيف" value={L.awayBadgeX} onChange={(v) => up((n) => (n.awayBadgeX = v))} />
        <Num label="موضع اسم الضيف" value={L.awayNameLeftX} onChange={(v) => up((n) => (n.awayNameLeftX = v))} />
      </div>
    </details>
  );
}
