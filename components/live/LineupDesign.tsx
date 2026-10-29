import type { LineupLayout } from "@/config/lineupLayout";
import { Color, Num, Text, Toggle } from "./designControls";
import { useLang } from "@/lib/prefs";

interface Props {
  layout: LineupLayout;
  onChange: (next: LineupLayout) => void;
}

/** Every value the lineups poster reads, same as the other poster pages. */
export default function LineupDesign({ layout, onChange }: Props) {
  const { t } = useLang();
  const up = (fn: (n: LineupLayout) => void) => {
    const n: LineupLayout = structuredClone(layout);
    fn(n);
    onChange(n);
  };
  const P = layout.pitch;
  const T = layout.teams;
  const M = layout.player;

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
        <Toggle label={t("الخطة")} value={T.formationShow} onChange={(v) => up((n) => (n.teams.formationShow = v))} />
        <Toggle label={t("المدرب")} value={T.coachShow} onChange={(v) => up((n) => (n.teams.coachShow = v))} />
        <Num label={t("موضع الضيف رأسياً")} value={T.awayY} onChange={(v) => up((n) => (n.teams.awayY = v))} />
        <Num label={t("موضع المضيف رأسياً")} value={T.homeY} onChange={(v) => up((n) => (n.teams.homeY = v))} />
        <Num label={t("حجم الشعار")} value={T.crestSize} onChange={(v) => up((n) => (n.teams.crestSize = v))} />
        <Num label={t("موضع الشعار")} value={T.crestX} onChange={(v) => up((n) => (n.teams.crestX = v))} />
        <Num label={t("حجم الاسم")} value={T.nameFontSize} onChange={(v) => up((n) => (n.teams.nameFontSize = v))} />
        <Color label={t("لون الاسم")} value={T.nameColor} onChange={(v) => up((n) => (n.teams.nameColor = v))} />
        <Num label={t("موضع الخطة والمدرب")} value={T.metaX} onChange={(v) => up((n) => (n.teams.metaX = v))} />
        <Num label={t("حجم الخطة والمدرب")} value={T.metaFontSize} onChange={(v) => up((n) => (n.teams.metaFontSize = v))} />
        <Color label={t("لون الخطة والمدرب")} value={T.metaColor} onChange={(v) => up((n) => (n.teams.metaColor = v))} />
      </div>

      <h4>{t("الخصم (عند تصدير فريق واحد)")}</h4>
      <Text label={t("النص قبل اسم الخصم")} value={layout.opponent.text ?? ""} onChange={(v) => up((n) => (n.opponent.text = v))} />
      <div className="grid">
        <Toggle label={t("إظهار الخصم")} value={layout.opponent.show} onChange={(v) => up((n) => (n.opponent.show = v))} />
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
        <Num label={t("بعد الهجوم عن خط الوسط")} value={P.midGap} onChange={(v) => up((n) => (n.pitch.midGap = v))} />
        <Num label={t("الهامش الجانبي")} value={P.sidePad} onChange={(v) => up((n) => (n.pitch.sidePad = v))} />
      </div>

      <h4>{t("اللاعبون")}</h4>
      <div className="grid">
        <Toggle label={t("صور اللاعبين")} value={M.photos} onChange={(v) => up((n) => (n.player.photos = v))} />
        <Toggle label={t("الأرقام")} value={M.numberShow} onChange={(v) => up((n) => (n.player.numberShow = v))} />
        <Toggle label={t("الأسماء")} value={M.nameShow} onChange={(v) => up((n) => (n.player.nameShow = v))} />
        <Num label={t("حجم الدائرة")} value={M.size} onChange={(v) => up((n) => (n.player.size = v))} />
        <Num label={t("سمك الإطار")} value={M.ring} onChange={(v) => up((n) => (n.player.ring = v))} />
        <Color label={t("لون المضيف")} value={M.homeColor} onChange={(v) => up((n) => (n.player.homeColor = v))} />
        <Color label={t("لون الضيف")} value={M.awayColor} onChange={(v) => up((n) => (n.player.awayColor = v))} />
        <Color label={t("لون رقم المضيف")} value={M.homeInk} onChange={(v) => up((n) => (n.player.homeInk = v))} />
        <Color label={t("لون رقم الضيف")} value={M.awayInk} onChange={(v) => up((n) => (n.player.awayInk = v))} />
        <Num label={t("حجم الرقم")} value={M.numberFontSize} onChange={(v) => up((n) => (n.player.numberFontSize = v))} />
        <Num label={t("مسافة الاسم")} value={M.nameDy} onChange={(v) => up((n) => (n.player.nameDy = v))} />
        <Num label={t("حجم الاسم")} value={M.nameFontSize} onChange={(v) => up((n) => (n.player.nameFontSize = v))} />
        <Color label={t("لون الاسم")} value={M.nameColor} onChange={(v) => up((n) => (n.player.nameColor = v))} />
        <Num label={t("أقصى عرض للاسم")} value={M.nameMaxWidth} onChange={(v) => up((n) => (n.player.nameMaxWidth = v))} />
        <Color label={t("خلفية الاسم")} value={M.nameBg} onChange={(v) => up((n) => (n.player.nameBg = v))} />
        <Num label={t("شفافية خلفية الاسم")} value={M.nameBgOpacity} step={0.05} onChange={(v) => up((n) => (n.player.nameBgOpacity = v))} />
        <Num label={t("تكبير اللاعبين (فريق واحد)")} value={layout.singleScale} step={0.05} onChange={(v) => up((n) => (n.singleScale = v))} />
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
