import type { GoalLayout, GoalText } from "@/config/goalLayout";
import { Color, Num, Text, Toggle } from "./designControls";
import { useLang } from "@/lib/prefs";

interface Props {
  layout: GoalLayout;
  onChange: (next: GoalLayout) => void;
}

/** Every value the goal poster reads, same as the other posters. */
export default function GoalDesign({ layout, onChange }: Props) {
  const { t } = useLang();
  const up = (fn: (n: GoalLayout) => void) => {
    const n: GoalLayout = structuredClone(layout);
    fn(n);
    onChange(n);
  };
  const F = layout.face;
  const M = layout.minute;
  const S = layout.score;

  const textBlock = (key: "title" | "subtitle" | "name" | "footer", name: string, withText: boolean) => {
    const tx: GoalText = layout[key];
    return (
      <>
        <h4>{name}</h4>
        {withText && <Text label={t("النص (فارغ = تلقائي)", "Text (empty = automatic)")} value={tx.text ?? ""} onChange={(v) => up((n) => (n[key].text = v))} />}
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

      {textBlock("title", t("العنوان"), true)}
      {textBlock("subtitle", t("العنوان الفرعي"), true)}

      <h4>{t("صورة اللاعب", "Player photo")}</h4>
      <div className="grid">
        <Toggle label={t("إظهار")} value={F.show} onChange={(v) => up((n) => (n.face.show = v))} />
        <Num label={t("الحجم")} value={F.size} onChange={(v) => up((n) => (n.face.size = v))} />
        <Num label={t("موضعه أفقياً")} value={F.x} onChange={(v) => up((n) => (n.face.x = v))} />
        <Num label={t("موضعه رأسياً")} value={F.y} onChange={(v) => up((n) => (n.face.y = v))} />
        <Num label={t("سمك الإطار", "Ring width")} value={F.ringWidth} onChange={(v) => up((n) => (n.face.ringWidth = v))} />
        <Color label={t("لون الإطار", "Ring colour")} value={F.ringColor} onChange={(v) => up((n) => (n.face.ringColor = v))} />
        <Color label={t("لون الخلفية", "Background colour")} value={F.background} onChange={(v) => up((n) => (n.face.background = v))} />
      </div>

      {textBlock("name", t("اسم اللاعب", "Player name"), false)}

      <h4>{t("الدقيقة", "Minute")}</h4>
      <div className="grid">
        <Toggle label={t("إظهار")} value={M.show} onChange={(v) => up((n) => (n.minute.show = v))} />
        <Num label={t("الحجم")} value={M.fontSize} onChange={(v) => up((n) => (n.minute.fontSize = v))} />
        <Num label={t("موضعه أفقياً")} value={M.x} onChange={(v) => up((n) => (n.minute.x = v))} />
        <Num label={t("موضعه رأسياً")} value={M.y} onChange={(v) => up((n) => (n.minute.y = v))} />
        <Num label={t("الاستدارة", "Corner radius")} value={M.radius} onChange={(v) => up((n) => (n.minute.radius = v))} />
        <Color label={t("اللون")} value={M.color} onChange={(v) => up((n) => (n.minute.color = v))} />
        <Color label={t("لون الخلفية", "Background colour")} value={M.background} onChange={(v) => up((n) => (n.minute.background = v))} />
      </div>

      <h4>{t("الفريقان والنتيجة")}</h4>
      <div className="grid">
        <Toggle label={t("إظهار")} value={S.show} onChange={(v) => up((n) => (n.score.show = v))} />
        <Num label={t("موضعهما رأسياً")} value={S.y} onChange={(v) => up((n) => (n.score.y = v))} />
        <Num label={t("حجم الشعار", "Crest size")} value={S.crestSize} onChange={(v) => up((n) => (n.score.crestSize = v))} />
        <Num label={t("موضع المستضيف", "Home position")} value={S.nearX} onChange={(v) => up((n) => (n.score.nearX = v))} />
        <Num label={t("موضع الضيف", "Away position")} value={S.farX} onChange={(v) => up((n) => (n.score.farX = v))} />
        <Num label={t("حجم النتيجة", "Score size")} value={S.fontSize} onChange={(v) => up((n) => (n.score.fontSize = v))} />
        <Color label={t("لون النتيجة", "Score colour")} value={S.color} onChange={(v) => up((n) => (n.score.color = v))} />
        <Num label={t("حجم الاسم", "Name size")} value={S.nameFontSize} onChange={(v) => up((n) => (n.score.nameFontSize = v))} />
        <Num label={t("مسافة الاسم", "Name offset")} value={S.nameDy} onChange={(v) => up((n) => (n.score.nameDy = v))} />
        <Color label={t("لون الاسم", "Name colour")} value={S.nameColor} onChange={(v) => up((n) => (n.score.nameColor = v))} />
      </div>

      {textBlock("footer", t("التذييل", "Footer"), true)}
    </details>
  );
}
