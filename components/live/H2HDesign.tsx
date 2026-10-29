import type { H2HLayout } from "@/config/h2hLayout";
import { Color, Num, Text, Toggle } from "./designControls";
import { useLang } from "@/lib/prefs";

interface Props {
  layout: H2HLayout;
  onChange: (next: H2HLayout) => void;
}

/** Every value the head-to-head poster reads, same as the other poster pages. */
export default function H2HDesign({ layout, onChange }: Props) {
  const { t } = useLang();
  const up = (fn: (n: H2HLayout) => void) => {
    const n: H2HLayout = structuredClone(layout);
    fn(n);
    onChange(n);
  };
  const T = layout.teams;
  const R = layout.record;
  const B = layout.rowBg;
  const D = layout.rowDate;

  return (
    <details className="card collapsible">
      <summary><h3>{t("التصميم")}</h3><span className="chev" /></summary>

      <h4>{t("العنوان")}</h4>
      <Text label={t("نص العنوان")} value={layout.title.text ?? ""} onChange={(v) => up((n) => (n.title.text = v))} />
      <div className="grid">
        <Toggle label={t("إظهار العنوان")} value={layout.title.show} onChange={(v) => up((n) => (n.title.show = v))} />
        <Num label={t("حجم العنوان")} value={layout.title.fontSize} onChange={(v) => up((n) => (n.title.fontSize = v))} />
        <Num label={t("موضعه أفقياً")} value={layout.title.x} onChange={(v) => up((n) => (n.title.x = v))} />
        <Num label={t("موضعه رأسياً")} value={layout.title.y} onChange={(v) => up((n) => (n.title.y = v))} />
        <Color label={t("لون العنوان")} value={layout.title.color} onChange={(v) => up((n) => (n.title.color = v))} />
      </div>

      <h4>{t("العنوان الفرعي")}</h4>
      <Text label={t("نص الفرعي (فارغ = اسم المسابقة)")} value={layout.subtitle.text ?? ""} onChange={(v) => up((n) => (n.subtitle.text = v))} />
      <div className="grid">
        <Toggle label={t("إظهار الفرعي")} value={layout.subtitle.show} onChange={(v) => up((n) => (n.subtitle.show = v))} />
        <Num label={t("حجم الفرعي")} value={layout.subtitle.fontSize} onChange={(v) => up((n) => (n.subtitle.fontSize = v))} />
        <Num label={t("موضعه أفقياً")} value={layout.subtitle.x} onChange={(v) => up((n) => (n.subtitle.x = v))} />
        <Num label={t("موضعه رأسياً")} value={layout.subtitle.y} onChange={(v) => up((n) => (n.subtitle.y = v))} />
        <Color label={t("لون الفرعي")} value={layout.subtitle.color} onChange={(v) => up((n) => (n.subtitle.color = v))} />
      </div>

      <h4>{t("الفريقان")}</h4>
      <div className="grid">
        <Toggle label={t("إظهار الفريقين")} value={T.show} onChange={(v) => up((n) => (n.teams.show = v))} />
        <Num label={t("موضعهما رأسياً")} value={T.y} onChange={(v) => up((n) => (n.teams.y = v))} />
        <Num label={t("حجم الشعار")} value={T.crestSize} onChange={(v) => up((n) => (n.teams.crestSize = v))} />
        <Num label={t("موضع الأول")} value={T.nearX} onChange={(v) => up((n) => (n.teams.nearX = v))} />
        <Num label={t("موضع الثاني")} value={T.farX} onChange={(v) => up((n) => (n.teams.farX = v))} />
        <Num label={t("مسافة الاسم")} value={T.nameDy} onChange={(v) => up((n) => (n.teams.nameDy = v))} />
        <Num label={t("حجم الاسم")} value={T.nameFontSize} onChange={(v) => up((n) => (n.teams.nameFontSize = v))} />
        <Color label={t("لون الاسم")} value={T.nameColor} onChange={(v) => up((n) => (n.teams.nameColor = v))} />
        <Num label={t("حجم «ضد»")} value={T.vsFontSize} onChange={(v) => up((n) => (n.teams.vsFontSize = v))} />
        <Color label={t("لون «ضد»")} value={T.vsColor} onChange={(v) => up((n) => (n.teams.vsColor = v))} />
      </div>

      <h4>{t("السجل")}</h4>
      <Text label={t("كلمة التعادل")} value={layout.record.drawLabel.text ?? ""} onChange={(v) => up((n) => (n.record.drawLabel.text = v))} />
      <div className="grid">
        <Toggle label={t("إظهار السجل")} value={R.show} onChange={(v) => up((n) => (n.record.show = v))} />
        <Num label={t("موضعه رأسياً")} value={R.y} onChange={(v) => up((n) => (n.record.y = v))} />
        <Num label={t("حجم الأرقام")} value={R.fontSize} onChange={(v) => up((n) => (n.record.fontSize = v))} />
        <Color label={t("لون الأرقام")} value={R.color} onChange={(v) => up((n) => (n.record.color = v))} />
        <Color label={t("لون التعادل")} value={R.drawColor} onChange={(v) => up((n) => (n.record.drawColor = v))} />
        <Toggle label={t("إظهار كلمة التعادل")} value={R.drawLabel.show} onChange={(v) => up((n) => (n.record.drawLabel.show = v))} />
        <Num label={t("موضع الكلمة")} value={R.drawLabel.dy} onChange={(v) => up((n) => (n.record.drawLabel.dy = v))} />
        <Num label={t("حجم الكلمة")} value={R.drawLabel.fontSize} onChange={(v) => up((n) => (n.record.drawLabel.fontSize = v))} />
        <Color label={t("لون الكلمة")} value={R.drawLabel.color} onChange={(v) => up((n) => (n.record.drawLabel.color = v))} />
        <Num label={t("مسافة السطر")} value={R.metaDy} onChange={(v) => up((n) => (n.record.metaDy = v))} />
        <Num label={t("حجم السطر")} value={R.metaFontSize} onChange={(v) => up((n) => (n.record.metaFontSize = v))} />
        <Color label={t("لون السطر")} value={R.metaColor} onChange={(v) => up((n) => (n.record.metaColor = v))} />
      </div>

      <h4>{t("الصفوف")}</h4>
      <div className="grid">
        <Num label={t("عدد المواجهات")} value={layout.rows} onChange={(v) => up((n) => (n.rows = Math.max(1, Math.min(8, v || 5))))} />
        <Toggle label={t("هذه المسابقة فقط")} value={layout.sameCompetitionOnly} onChange={(v) => up((n) => (n.sameCompetitionOnly = v))} />
        <Num label={t("موضع أول صف")} value={layout.firstRowY} onChange={(v) => up((n) => (n.firstRowY = v))} />
        <Num label={t("ارتفاع الصف")} value={layout.rowHeight} onChange={(v) => up((n) => (n.rowHeight = v))} />
        <Num label={t("حجم النتيجة")} value={layout.rowScoreFontSize} onChange={(v) => up((n) => (n.rowScoreFontSize = v))} />
        <Color label={t("لون النتيجة")} value={layout.rowScoreColor} onChange={(v) => up((n) => (n.rowScoreColor = v))} />
        <Num label={t("حجم الاسم")} value={layout.rowNameFontSize} onChange={(v) => up((n) => (n.rowNameFontSize = v))} />
        <Color label={t("لون الاسم")} value={layout.rowNameColor} onChange={(v) => up((n) => (n.rowNameColor = v))} />
        <Num label={t("موضع الاسم الأول")} value={layout.rowNameRight} onChange={(v) => up((n) => (n.rowNameRight = v))} />
        <Num label={t("موضع الاسم الثاني")} value={layout.rowNameLeft} onChange={(v) => up((n) => (n.rowNameLeft = v))} />
        <Num label={t("عرض الاسم")} value={layout.rowNameWidth} onChange={(v) => up((n) => (n.rowNameWidth = v))} />
        <Num label={t("موضع الشعار الأول")} value={layout.rowCrestNear} onChange={(v) => up((n) => (n.rowCrestNear = v))} />
        <Num label={t("موضع الشعار الثاني")} value={layout.rowCrestFar} onChange={(v) => up((n) => (n.rowCrestFar = v))} />
        <Num label={t("حجم شعار الصف")} value={layout.rowCrestSize} onChange={(v) => up((n) => (n.rowCrestSize = v))} />
      </div>

      <h4>{t("بطاقة الصف وسطر التاريخ")}</h4>
      <div className="grid">
        <Toggle label={t("إظهار البطاقة")} value={B.show} onChange={(v) => up((n) => (n.rowBg.show = v))} />
        <Num label={t("ارتفاع البطاقة")} value={B.height} onChange={(v) => up((n) => (n.rowBg.height = v))} />
        <Num label={t("الهامش الجانبي")} value={B.insetX} onChange={(v) => up((n) => (n.rowBg.insetX = v))} />
        <Num label={t("الاستدارة")} value={B.radius} onChange={(v) => up((n) => (n.rowBg.radius = v))} />
        <Num label={t("الشفافية")} value={B.opacity} step={0.05} onChange={(v) => up((n) => (n.rowBg.opacity = v))} />
        <Color label={t("لون البطاقة")} value={B.color} onChange={(v) => up((n) => (n.rowBg.color = v))} />
        <Toggle label={t("إظهار التاريخ")} value={D.show} onChange={(v) => up((n) => (n.rowDate.show = v))} />
        <Num label={t("موضع التاريخ")} value={D.dy} onChange={(v) => up((n) => (n.rowDate.dy = v))} />
        <Num label={t("حجم التاريخ")} value={D.fontSize} onChange={(v) => up((n) => (n.rowDate.fontSize = v))} />
        <Color label={t("لون التاريخ")} value={D.color} onChange={(v) => up((n) => (n.rowDate.color = v))} />
      </div>

      <h4>{t("التذييل")}</h4>
      <Text label={t("نص التذييل")} value={layout.footer.text ?? ""} onChange={(v) => up((n) => (n.footer.text = v))} />
      <div className="grid">
        <Toggle label={t("إظهار التذييل")} value={layout.footer.show} onChange={(v) => up((n) => (n.footer.show = v))} />
        <Num label={t("حجم التذييل")} value={layout.footer.fontSize} onChange={(v) => up((n) => (n.footer.fontSize = v))} />
        <Num label={t("موضعه أفقياً")} value={layout.footer.x} onChange={(v) => up((n) => (n.footer.x = v))} />
        <Num label={t("موضعه رأسياً")} value={layout.footer.y} onChange={(v) => up((n) => (n.footer.y = v))} />
        <Color label={t("لون التذييل")} value={layout.footer.color} onChange={(v) => up((n) => (n.footer.color = v))} />
      </div>
    </details>
  );
}
