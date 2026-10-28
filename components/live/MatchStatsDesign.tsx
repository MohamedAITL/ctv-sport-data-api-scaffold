import type { MatchStatsLayout, MatchStatsText } from "@/config/matchStatsLayout";
import { Color, Num, Text, Toggle } from "./designControls";

interface Props {
  layout: MatchStatsLayout;
  onChange: (next: MatchStatsLayout) => void;
}

/** Every value the match statistics poster reads, same as the other posters. */
export default function MatchStatsDesign({ layout, onChange }: Props) {
  const up = (fn: (n: MatchStatsLayout) => void) => {
    const n: MatchStatsLayout = structuredClone(layout);
    fn(n);
    onChange(n);
  };
  const T = layout.teams;
  const B = layout.rowBg;
  const V = layout.value;
  const R = layout.bar;

  const textBlock = (key: "title" | "subtitle" | "footer", name: string, textLabel: string) => {
    const t: MatchStatsText = layout[key];
    return (
      <>
        <h4>{name}</h4>
        <Text label={textLabel} value={t.text ?? ""} onChange={(v) => up((n) => (n[key].text = v))} />
        <div className="grid">
          <Toggle label="إظهار" value={t.show} onChange={(v) => up((n) => (n[key].show = v))} />
          <Num label="الحجم" value={t.fontSize} onChange={(v) => up((n) => (n[key].fontSize = v))} />
          <Num label="موضعه أفقياً" value={t.x} onChange={(v) => up((n) => (n[key].x = v))} />
          <Num label="موضعه رأسياً" value={t.y} onChange={(v) => up((n) => (n[key].y = v))} />
          <Color label="اللون" value={t.color} onChange={(v) => up((n) => (n[key].color = v))} />
        </div>
      </>
    );
  };

  return (
    <details className="card collapsible">
      <summary><h3>التصميم</h3><span className="chev" /></summary>

      {textBlock("title", "العنوان", "نص العنوان")}
      {textBlock("subtitle", "العنوان الفرعي", "نص الفرعي (فارغ = المسابقة والشوط)")}

      <h4>الفريقان والنتيجة</h4>
      <div className="grid">
        <Toggle label="إظهار الفريقين" value={T.show} onChange={(v) => up((n) => (n.teams.show = v))} />
        <Num label="موضعهما رأسياً" value={T.y} onChange={(v) => up((n) => (n.teams.y = v))} />
        <Num label="حجم الشعار" value={T.crestSize} onChange={(v) => up((n) => (n.teams.crestSize = v))} />
        <Num label="موضع المضيف" value={T.nearX} onChange={(v) => up((n) => (n.teams.nearX = v))} />
        <Num label="موضع الضيف" value={T.farX} onChange={(v) => up((n) => (n.teams.farX = v))} />
        <Num label="مسافة الاسم" value={T.nameDy} onChange={(v) => up((n) => (n.teams.nameDy = v))} />
        <Num label="حجم الاسم" value={T.nameFontSize} onChange={(v) => up((n) => (n.teams.nameFontSize = v))} />
        <Color label="لون الاسم" value={T.nameColor} onChange={(v) => up((n) => (n.teams.nameColor = v))} />
        <Num label="حجم النتيجة" value={T.scoreFontSize} onChange={(v) => up((n) => (n.teams.scoreFontSize = v))} />
        <Color label="لون النتيجة" value={T.scoreColor} onChange={(v) => up((n) => (n.teams.scoreColor = v))} />
        <Num label="مسافة الحالة" value={T.statusDy} onChange={(v) => up((n) => (n.teams.statusDy = v))} />
        <Num label="حجم الحالة" value={T.statusFontSize} onChange={(v) => up((n) => (n.teams.statusFontSize = v))} />
        <Color label="لون الحالة" value={T.statusColor} onChange={(v) => up((n) => (n.teams.statusColor = v))} />
      </div>

      <h4>صفوف الإحصائيات</h4>
      <div className="grid">
        <Num label="موضع أول صف" value={layout.firstRowY} onChange={(v) => up((n) => (n.firstRowY = v))} />
        <Num label="ارتفاع الصف" value={layout.rowHeight} onChange={(v) => up((n) => (n.rowHeight = v))} />
        <Num label="أدنى موضع لآخر صف" value={layout.lastRowY} onChange={(v) => up((n) => (n.lastRowY = v))} />
        <Num label="حجم اسم الإحصائية" value={layout.label.fontSize} onChange={(v) => up((n) => (n.label.fontSize = v))} />
        <Num label="موضع اسم الإحصائية" value={layout.label.dy} onChange={(v) => up((n) => (n.label.dy = v))} />
        <Color label="لون اسم الإحصائية" value={layout.label.color} onChange={(v) => up((n) => (n.label.color = v))} />
        <Num label="حجم الأرقام" value={V.fontSize} onChange={(v) => up((n) => (n.value.fontSize = v))} />
        <Color label="لون الأرقام" value={V.color} onChange={(v) => up((n) => (n.value.color = v))} />
        <Color label="لون الرقم الأعلى" value={V.leadColor} onChange={(v) => up((n) => (n.value.leadColor = v))} />
        <Num label="موضع رقم المضيف" value={V.nearX} onChange={(v) => up((n) => (n.value.nearX = v))} />
        <Num label="موضع رقم الضيف" value={V.farX} onChange={(v) => up((n) => (n.value.farX = v))} />
      </div>

      <h4>شريط المقارنة</h4>
      <div className="grid">
        <Toggle label="إظهار الشريط" value={R.show} onChange={(v) => up((n) => (n.bar.show = v))} />
        <Num label="موضعه رأسياً" value={R.dy} onChange={(v) => up((n) => (n.bar.dy = v))} />
        <Num label="سمكه" value={R.height} onChange={(v) => up((n) => (n.bar.height = v))} />
        <Num label="نصف عرضه" value={R.halfWidth} onChange={(v) => up((n) => (n.bar.halfWidth = v))} />
        <Num label="الاستدارة" value={R.radius} onChange={(v) => up((n) => (n.bar.radius = v))} />
        <Color label="لون المضيف" value={R.homeColor} onChange={(v) => up((n) => (n.bar.homeColor = v))} />
        <Color label="لون الضيف" value={R.awayColor} onChange={(v) => up((n) => (n.bar.awayColor = v))} />
        <Color label="لون الخلفية" value={R.trackColor} onChange={(v) => up((n) => (n.bar.trackColor = v))} />
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

      {textBlock("footer", "التذييل", "نص التذييل")}
    </details>
  );
}
