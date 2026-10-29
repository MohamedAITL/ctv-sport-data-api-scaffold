import type { MoroccanLayout } from "@/config/moroccanLayout";
import { Color, Num, Text, Toggle } from "./live/designControls";

interface Props {
  layout: MoroccanLayout;
  onChange: (next: MoroccanLayout) => void;
}

type RKey = keyof Omit<MoroccanLayout["roundup"], "card">;
type SKey = keyof MoroccanLayout["spotlight"];

/** Every value the Moroccan players poster reads, roundup and spotlight. */
export default function MoroccanDesign({ layout, onChange }: Props) {
  const up = (fn: (n: MoroccanLayout) => void) => {
    const n: MoroccanLayout = structuredClone(layout);
    fn(n);
    onChange(n);
  };
  const R = layout.roundup;
  const S = layout.spotlight;
  const C = R.card;
  const rNum = (k: RKey, label: string) => <Num key={k} label={label} value={R[k] as number} onChange={(v) => up((n) => { (n.roundup[k] as number) = v; })} />;
  const rColor = (k: RKey, label: string) => <Color key={k} label={label} value={R[k] as string} onChange={(v) => up((n) => { (n.roundup[k] as string) = v; })} />;
  const sNum = (k: SKey, label: string) => <Num key={k} label={label} value={S[k] as number} onChange={(v) => up((n) => { (n.spotlight[k] as number) = v; })} />;
  const sColor = (k: SKey, label: string) => <Color key={k} label={label} value={S[k] as string} onChange={(v) => up((n) => { (n.spotlight[k] as string) = v; })} />;

  const textBlock = (key: "title" | "subtitle" | "footer", name: string, textLabel: string) => {
    const t = layout[key];
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
      {textBlock("subtitle", "العنوان الفرعي", "نص الفرعي (فارغ = إحصائيات الموسم)")}

      <h4>القائمة (أكثر من لاعب)</h4>
      <div className="grid">
        {rNum("firstRowY", "موضع أول صف")}
        {rNum("rowHeight", "ارتفاع الصف")}
        {rNum("lastRowY", "أدنى موضع لآخر صف")}
        {rNum("faceX", "موضع الصورة")}
        {rNum("faceSize", "حجم الصورة")}
        {rColor("ringColor", "لون إطار الصورة")}
        {rNum("clubSize", "حجم شعار النادي")}
        {rNum("nameRightX", "موضع الاسم")}
        {rNum("nameDy", "إزاحة الاسم رأسياً")}
        {rNum("nameFontSize", "حجم الاسم")}
        {rColor("nameColor", "لون الاسم")}
        {rNum("metaDy", "إزاحة سطر المسابقة")}
        {rNum("metaFontSize", "حجم سطر المسابقة")}
        {rColor("metaColor", "لون سطر المسابقة")}
        {rNum("compLogoSize", "حجم شعار المسابقة")}
        {rNum("valueX", "موضع الرقم")}
        {rNum("valueFontSize", "حجم الرقم")}
        {rColor("valueColor", "لون الرقم")}
        {rNum("rankX", "موضع الترتيب")}
        {rNum("rankSize", "حجم دائرة الترتيب")}
        {rNum("rankFontSize", "حجم رقم الترتيب")}
        {rColor("rankBg", "لون دائرة الترتيب")}
        {rColor("rankColor", "لون رقم الترتيب")}
      </div>
      <h4>بطاقة الصف</h4>
      <div className="grid">
        <Toggle label="إظهار البطاقة" value={C.show} onChange={(v) => up((n) => (n.roundup.card.show = v))} />
        <Num label="ارتفاع البطاقة" value={C.height} onChange={(v) => up((n) => (n.roundup.card.height = v))} />
        <Num label="الهامش الجانبي" value={C.insetX} onChange={(v) => up((n) => (n.roundup.card.insetX = v))} />
        <Num label="الاستدارة" value={C.radius} onChange={(v) => up((n) => (n.roundup.card.radius = v))} />
        <Num label="الشفافية" value={C.opacity} step={0.05} onChange={(v) => up((n) => (n.roundup.card.opacity = v))} />
        <Color label="لون البطاقة" value={C.color} onChange={(v) => up((n) => (n.roundup.card.color = v))} />
      </div>

      <h4>البطاقة الفردية (لاعب واحد)</h4>
      <div className="grid">
        {sNum("faceY", "موضع الصورة")}
        {sNum("faceSize", "حجم الصورة")}
        {sNum("ringWidth", "سمك الإطار")}
        {sColor("ringColor", "لون الإطار")}
        {sNum("clubSize", "حجم شعار النادي")}
        {sNum("nameY", "موضع الاسم")}
        {sNum("nameFontSize", "حجم الاسم")}
        {sColor("nameColor", "لون الاسم")}
        {sNum("compY", "موضع المسابقة")}
        {sNum("compLogoSize", "حجم شعار المسابقة")}
        {sNum("compFontSize", "حجم اسم المسابقة")}
        {sColor("compColor", "لون المسابقة")}
        {sNum("valueY", "موضع الرقم")}
        {sNum("valueFontSize", "حجم الرقم")}
        {sColor("valueColor", "لون الرقم")}
        {sNum("categoryY", "موضع الإحصائية")}
        {sNum("categoryFontSize", "حجم الإحصائية")}
        {sColor("categoryColor", "لون الإحصائية")}
        {sNum("rankY", "موضع سطر الترتيب")}
        {sNum("rankFontSize", "حجم سطر الترتيب")}
        {sColor("rankColor", "لون سطر الترتيب")}
      </div>

      {textBlock("footer", "التذييل", "نص التذييل")}
    </details>
  );
}
