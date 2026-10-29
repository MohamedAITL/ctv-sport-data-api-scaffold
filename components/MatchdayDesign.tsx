import type { MatchdayLayout } from "@/config/matchdayLayout";
import { useLang } from "@/lib/prefs";

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
  return <label className="field wide"><span>{label}</span><input type="text" dir="auto" value={value} onChange={(e) => onChange(e.target.value)} /></label>;
}

export default function MatchdayDesign({ layout, onChange }: Props) {
  const { t } = useLang();
  const up = (fn: (n: MatchdayLayout) => void) => { const n = structuredClone(layout); fn(n); onChange(n); };
  const L = layout;
  return (
    <details className="card collapsible">
      <summary><h3>{t("التصميم")}</h3><span className="chev" /></summary>
      <h4>{t("عناصر إضافية (أطفئها إذا كان القالب يحتويها)")}</h4>
      <div className="grid">
        <Toggle label={t("العنوان")} value={L.title.show} onChange={(v) => up((n) => (n.title.show = v))} />
        <Toggle label={t("عنوان النتائج")} value={L.resultsTitle.show} onChange={(v) => up((n) => (n.resultsTitle.show = v))} />
        <Toggle label={t("سطر التاريخ")} value={L.dateLabel.show} onChange={(v) => up((n) => (n.dateLabel.show = v))} />
        <Toggle label={t("بطاقات الصفوف")} value={L.rowBg.show} onChange={(v) => up((n) => (n.rowBg.show = v))} />
      </div>
      {L.title.show && (
        <div className="grid">
          <Text label={t("نص العنوان")} value={L.title.text || ""} onChange={(v) => up((n) => (n.title.text = v))} />
          <Num label={t("حجم العنوان")} value={L.title.fontSize} onChange={(v) => up((n) => (n.title.fontSize = v))} />
          <Num label={t("موضع العنوان رأسياً")} value={L.title.y} onChange={(v) => up((n) => (n.title.y = v))} />
          <Num label={t("موضع العنوان أفقياً")} value={L.title.x} onChange={(v) => up((n) => (n.title.x = v))} />
          <Color label={t("لون العنوان")} value={L.title.color} onChange={(v) => up((n) => (n.title.color = v))} />
        </div>
      )}
      {L.resultsTitle.show && (
        <div className="grid">
          <Text label={t("نص عنوان النتائج")} value={L.resultsTitle.text || ""} onChange={(v) => up((n) => (n.resultsTitle.text = v))} />
          <Num label={t("حجم عنوان النتائج")} value={L.resultsTitle.fontSize} onChange={(v) => up((n) => (n.resultsTitle.fontSize = v))} />
          <Num label={t("موضع عنوان النتائج رأسياً")} value={L.resultsTitle.y} onChange={(v) => up((n) => (n.resultsTitle.y = v))} />
          <Num label={t("موضع عنوان النتائج أفقياً")} value={L.resultsTitle.x} onChange={(v) => up((n) => (n.resultsTitle.x = v))} />
          <Color label={t("لون عنوان النتائج")} value={L.resultsTitle.color} onChange={(v) => up((n) => (n.resultsTitle.color = v))} />
        </div>
      )}
      {L.dateLabel.show && (
        <div className="grid">
          <Text label={t("نص التاريخ")} value={L.dateLabel.text || ""} onChange={(v) => up((n) => (n.dateLabel.text = v))} />
          <Num label={t("حجم التاريخ")} value={L.dateLabel.fontSize} onChange={(v) => up((n) => (n.dateLabel.fontSize = v))} />
          <Num label={t("موضع التاريخ أفقياً")} value={L.dateLabel.x} onChange={(v) => up((n) => (n.dateLabel.x = v))} />
          <Num label={t("موضع التاريخ رأسياً")} value={L.dateLabel.y} onChange={(v) => up((n) => (n.dateLabel.y = v))} />
          <Color label={t("لون التاريخ")} value={L.dateLabel.color} onChange={(v) => up((n) => (n.dateLabel.color = v))} />
        </div>
      )}
      <h4>{t("الأحجام والمسافات")}</h4>
      <div className="grid">
        <Toggle label={t("حافظ على حجم الشعارات والأسماء (عند كثرة المباريات تُضغط المسافات أولاً)")} value={L.keepSizes} onChange={(v) => up((n) => (n.keepSizes = v))} />
        <Num label={t("حجم شعار النادي")} value={L.badgeSize} onChange={(v) => up((n) => (n.badgeSize = v))} />
        <Num label={t("حجم اسم النادي")} value={L.nameFontSize} onChange={(v) => up((n) => (n.nameFontSize = v))} />
        <Num label={t("حجم التوقيت / النتيجة")} value={L.centerFontSize} onChange={(v) => up((n) => (n.centerFontSize = v))} />
        <Num label={t("المسافة بين المباريات (ارتفاع الصف)")} value={L.rowHeight} step={0.5} onChange={(v) => up((n) => (n.rowHeight = v))} />
        <Num label={t("المسافة بين المسابقات")} value={L.groupGap} onChange={(v) => up((n) => (n.groupGap = v))} />
        <Num label={t("مساحة عنوان المسابقة")} value={L.groupHeader.height} onChange={(v) => up((n) => (n.groupHeader.height = v))} />
        <Num label={t("ارتفاع البطاقة")} value={L.rowBg.height} onChange={(v) => up((n) => (n.rowBg.height = v))} />
      </div>

      <h4>{t("عناوين المسابقات")}</h4>
      <div className="grid">
        <Toggle label={t("إظهار العناوين")} value={L.groupHeader.show} onChange={(v) => up((n) => (n.groupHeader.show = v))} />
        <Num label={t("حجم العنوان")} value={L.groupHeader.fontSize} onChange={(v) => up((n) => (n.groupHeader.fontSize = v))} />
        <Num label={t("شعار المسابقة")} value={L.groupHeader.logoSize} onChange={(v) => up((n) => (n.groupHeader.logoSize = v))} />
        <Color label={t("لون العنوان")} value={L.groupHeader.color} onChange={(v) => up((n) => (n.groupHeader.color = v))} />
        <Num label={t("موضع العناوين رأسياً")} value={L.groupHeader.dy} onChange={(v) => up((n) => (n.groupHeader.dy = v))} />
      </div>

      <h4>{t("الصفوف")}</h4>
      <div className="grid">
        <Num label={t("موضع أول صف")} value={L.firstRowCenterY} onChange={(v) => up((n) => (n.firstRowCenterY = v))} />
        <Num label={t("أقصى عرض للاسم")} value={L.nameMaxWidth} onChange={(v) => up((n) => (n.nameMaxWidth = v))} />
        <Color label={t("لون الاسم")} value={L.nameColor} onChange={(v) => up((n) => (n.nameColor = v))} />
        <Color label={t("لون الوسط")} value={L.centerColor} onChange={(v) => up((n) => (n.centerColor = v))} />
        <Num label={t("شفافية البطاقة")} value={L.rowBg.opacity} step={0.02} onChange={(v) => up((n) => (n.rowBg.opacity = v))} />
        <Color label={t("لون البطاقة")} value={L.rowBg.color} onChange={(v) => up((n) => (n.rowBg.color = v))} />
        <Num label={t("الهامش الجانبي")} value={L.rowBg.insetX} onChange={(v) => up((n) => (n.rowBg.insetX = v))} />
        <Num label={t("استدارة البطاقة")} value={L.rowBg.radius} onChange={(v) => up((n) => (n.rowBg.radius = v))} />
      </div>
      <h4>{t("مواضع الأعمدة")}</h4>
      <div className="grid">
        <Num label={t("موضع شعار المضيف")} value={L.homeBadgeX} onChange={(v) => up((n) => (n.homeBadgeX = v))} />
        <Num label={t("موضع اسم المضيف")} value={L.homeNameRightX} onChange={(v) => up((n) => (n.homeNameRightX = v))} />
        <Num label={t("موضع الوسط")} value={L.centerX} onChange={(v) => up((n) => (n.centerX = v))} />
        <Num label={t("موضع شعار الضيف")} value={L.awayBadgeX} onChange={(v) => up((n) => (n.awayBadgeX = v))} />
        <Num label={t("موضع اسم الضيف")} value={L.awayNameLeftX} onChange={(v) => up((n) => (n.awayNameLeftX = v))} />
      </div>
    </details>
  );
}
