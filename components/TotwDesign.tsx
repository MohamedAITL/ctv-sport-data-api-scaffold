import type { TotwLayout, TotwText } from "@/config/totwLayout";
import { Color, Num, Text, Toggle } from "./live/designControls";
import { useLang } from "@/lib/prefs";

interface Props {
  layout: TotwLayout;
  onChange: (next: TotwLayout) => void;
}

/** Every value the team-of-the-round poster reads, same as the other poster pages. */
export default function TotwDesign({ layout, onChange }: Props) {
  const { t } = useLang();
  const up = (fn: (n: TotwLayout) => void) => {
    const n: TotwLayout = structuredClone(layout);
    fn(n);
    onChange(n);
  };
  const P = layout.pitch;
  const M = layout.player;
  const C = layout.coach;
  const text = (k: "title" | "subtitle" | "footer", label: string, hint = "") => {
    const tx: TotwText = layout[k];
    return (
      <>
        <h4>{t(label)}</h4>
        <Text label={t(`نص ${label}${hint}`, `${t(label)} text${hint ? ` (${t(hint.trim())})` : ""}`)} value={tx.text ?? ""} onChange={(v) => up((n) => (n[k].text = v))} />
        <div className="grid">
          <Toggle label={t(`إظهار ${label}`, `Show ${t(label).toLowerCase()}`)} value={tx.show} onChange={(v) => up((n) => (n[k].show = v))} />
          <Num label={t("الحجم")} value={tx.fontSize} onChange={(v) => up((n) => (n[k].fontSize = v))} />
          <Num label={t("موضعه أفقياً")} value={tx.x} onChange={(v) => up((n) => (n[k].x = v))} />
          <Num label={t("موضعه رأسياً")} value={tx.y} onChange={(v) => up((n) => (n[k].y = v))} />
          <Color label={t("اللون")} value={tx.color} onChange={(v) => up((n) => (n[k].color = v))} />
        </div>
      </>
    );
  };

  return (
    <details className="card collapsible">
      <summary><h3>{t("التصميم")}</h3><span className="chev" /></summary>

      {text("title", "العنوان")}
      {text("subtitle", "العنوان الفرعي", " (فارغ = المسابقة والجولة)")}

      <h4>{t("اللاعبون")}</h4>
      <div className="grid">
        <Num label={t("حجم الصورة")} value={M.size} onChange={(v) => up((n) => (n.player.size = v))} />
        <Num label={t("سمك الإطار")} value={M.ring} onChange={(v) => up((n) => (n.player.ring = v))} />
        <Color label={t("لون الإطار")} value={M.ringColor} onChange={(v) => up((n) => (n.player.ringColor = v))} />
        <Num label={t("مسافة الاسم")} value={M.nameDy} onChange={(v) => up((n) => (n.player.nameDy = v))} />
        <Num label={t("حجم الاسم")} value={M.nameFontSize} onChange={(v) => up((n) => (n.player.nameFontSize = v))} />
        <Color label={t("لون الاسم")} value={M.nameColor} onChange={(v) => up((n) => (n.player.nameColor = v))} />
        <Num label={t("أقصى عرض للاسم")} value={M.nameMaxWidth} onChange={(v) => up((n) => (n.player.nameMaxWidth = v))} />
        <Color label={t("خلفية الاسم")} value={M.nameBg} onChange={(v) => up((n) => (n.player.nameBg = v))} />
        <Num label={t("شفافية خلفية الاسم")} value={M.nameBgOpacity} step={0.05} onChange={(v) => up((n) => (n.player.nameBgOpacity = v))} />
        <Toggle label={t("شعار النادي")} value={M.crestShow} onChange={(v) => up((n) => (n.player.crestShow = v))} />
        <Num label={t("حجم الشعار")} value={M.crestSize} onChange={(v) => up((n) => (n.player.crestSize = v))} />
        <Toggle label={t("التقييم")} value={M.ratingShow} onChange={(v) => up((n) => (n.player.ratingShow = v))} />
        <Num label={t("حجم التقييم")} value={M.ratingFontSize} onChange={(v) => up((n) => (n.player.ratingFontSize = v))} />
        <Color label={t("لون التقييم")} value={M.ratingColor} onChange={(v) => up((n) => (n.player.ratingColor = v))} />
        <Color label={t("خلفية التقييم")} value={M.ratingBg} onChange={(v) => up((n) => (n.player.ratingBg = v))} />
      </div>

      <h4>{t("المدرب والخطة")}</h4>
      <div className="grid">
        <Toggle label={t("إظهار المدرب")} value={C.show} onChange={(v) => up((n) => (n.coach.show = v))} />
        <Num label={t("الموضع رأسياً")} value={C.y} onChange={(v) => up((n) => (n.coach.y = v))} />
        <Num label={t("حجم شعار المدرب")} value={C.crestSize} onChange={(v) => up((n) => (n.coach.crestSize = v))} />
        <Num label={t("موضع الشعار")} value={C.crestX} onChange={(v) => up((n) => (n.coach.crestX = v))} />
        <Num label={t("حجم الاسم")} value={C.fontSize} onChange={(v) => up((n) => (n.coach.fontSize = v))} />
        <Color label={t("لون الاسم")} value={C.color} onChange={(v) => up((n) => (n.coach.color = v))} />
        <Toggle label={t("إظهار الخطة")} value={C.formationShow} onChange={(v) => up((n) => (n.coach.formationShow = v))} />
        <Num label={t("موضع الخطة")} value={C.formationX} onChange={(v) => up((n) => (n.coach.formationX = v))} />
        <Num label={t("حجم الخطة")} value={C.formationFontSize} onChange={(v) => up((n) => (n.coach.formationFontSize = v))} />
        <Color label={t("لون الخطة")} value={C.formationColor} onChange={(v) => up((n) => (n.coach.formationColor = v))} />
      </div>

      <h4>{t("الملعب")}</h4>
      <div className="grid">
        <Num label={t("موضعه أفقياً")} value={P.x} onChange={(v) => up((n) => (n.pitch.x = v))} />
        <Num label={t("موضعه رأسياً")} value={P.y} onChange={(v) => up((n) => (n.pitch.y = v))} />
        <Num label={t("العرض")} value={P.w} onChange={(v) => up((n) => (n.pitch.w = v))} />
        <Num label={t("الارتفاع")} value={P.h} onChange={(v) => up((n) => (n.pitch.h = v))} />
        <Color label={t("لون العشب")} value={P.color} onChange={(v) => up((n) => (n.pitch.color = v))} />
        <Color label={t("لون الخطوط المتناوبة")} value={P.stripeColor} onChange={(v) => up((n) => (n.pitch.stripeColor = v))} />
        <Num label={t("عرض الخط المتناوب (0 = بدون)")} value={P.stripeHeight} onChange={(v) => up((n) => (n.pitch.stripeHeight = v))} />
        <Color label={t("لون خطوط الملعب")} value={P.lineColor} onChange={(v) => up((n) => (n.pitch.lineColor = v))} />
        <Num label={t("شفافية الخطوط")} value={P.lineOpacity} step={0.05} onChange={(v) => up((n) => (n.pitch.lineOpacity = v))} />
        <Num label={t("الاستدارة")} value={P.radius} onChange={(v) => up((n) => (n.pitch.radius = v))} />
        <Num label={t("بعد الحارس عن المرمى")} value={P.goalPad} onChange={(v) => up((n) => (n.pitch.goalPad = v))} />
        <Num label={t("بعد الهجوم عن المرمى المقابل")} value={P.midGap} onChange={(v) => up((n) => (n.pitch.midGap = v))} />
        <Num label={t("الهامش الجانبي")} value={P.sidePad} onChange={(v) => up((n) => (n.pitch.sidePad = v))} />
      </div>

      {text("footer", "التذييل")}
    </details>
  );
}
