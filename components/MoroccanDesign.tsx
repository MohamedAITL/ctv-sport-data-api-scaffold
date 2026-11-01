import type { MoroccanLayout } from "@/config/moroccanLayout";
import { Color, Num, Text, Toggle } from "./live/designControls";
import PlayerSpotlightDesign from "./PlayerSpotlightDesign";
import { useLang } from "@/lib/prefs";

interface Props {
  layout: MoroccanLayout;
  onChange: (next: MoroccanLayout) => void;
}

type RKey = keyof Omit<MoroccanLayout["roundup"], "card">;

/** Every value the Moroccan players poster reads, for several players or one. */
export default function MoroccanDesign({ layout, onChange }: Props) {
  const { t } = useLang();
  const up = (fn: (n: MoroccanLayout) => void) => {
    const n: MoroccanLayout = structuredClone(layout);
    fn(n);
    onChange(n);
  };
  const R = layout.roundup;
  const C = R.card;
  const rNum = (k: RKey, label: string) => <Num key={k} label={t(label)} value={R[k] as number} onChange={(v) => up((n) => { (n.roundup[k] as number) = v; })} />;
  const rColor = (k: RKey, label: string) => <Color key={k} label={t(label)} value={R[k] as string} onChange={(v) => up((n) => { (n.roundup[k] as string) = v; })} />;

  const textBlock = (key: "title" | "subtitle" | "footer", name: string, textLabel: string) => {
    const tx = layout[key];
    return (
      <>
        <h4>{t(name)}</h4>
        <Text label={t(textLabel)} value={tx.text ?? ""} onChange={(v) => up((n) => (n[key].text = v))} />
        <div className="grid">
          <Toggle label={t("إظهار")} value={tx.show} onChange={(v) => up((n) => (n[key].show = v))} />
          <Num label={t("الحجم")} value={tx.fontSize} onChange={(v) => up((n) => (n[key].fontSize = v))} />
          <Num label={t("موضعه أفقياً")} value={tx.x} onChange={(v) => up((n) => (n[key].x = v))} />
          <Num label={t("موضعه رأسياً")} value={tx.y} onChange={(v) => up((n) => (n[key].y = v))} />
          <Color label={t("اللون")} value={tx.color} onChange={(v) => up((n) => (n[key].color = v))} />
        </div>
      </>
    );
  };

  return (
    <details className="card collapsible">
      <summary><h3>{t("التصميم")}</h3><span className="chev" /></summary>

      {textBlock("title", "العنوان", "نص العنوان")}
      {textBlock("subtitle", "العنوان الفرعي", "نص الفرعي (فارغ = إحصائيات الموسم)")}

      <h4>{t("القائمة (أكثر من لاعب)")}</h4>
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
      <h4>{t("بطاقة الصف")}</h4>
      <div className="grid">
        <Toggle label={t("إظهار البطاقة")} value={C.show} onChange={(v) => up((n) => (n.roundup.card.show = v))} />
        <Num label={t("ارتفاع البطاقة")} value={C.height} onChange={(v) => up((n) => (n.roundup.card.height = v))} />
        <Num label={t("الهامش الجانبي")} value={C.insetX} onChange={(v) => up((n) => (n.roundup.card.insetX = v))} />
        <Num label={t("الاستدارة")} value={C.radius} onChange={(v) => up((n) => (n.roundup.card.radius = v))} />
        <Num label={t("الشفافية")} value={C.opacity} step={0.05} onChange={(v) => up((n) => (n.roundup.card.opacity = v))} />
        <Color label={t("لون البطاقة")} value={C.color} onChange={(v) => up((n) => (n.roundup.card.color = v))} />
      </div>

      <PlayerSpotlightDesign layout={layout.player} onChange={(v) => up((n) => { n.player = v; })} />

      {textBlock("footer", "التذييل", "نص التذييل")}
    </details>
  );
}
