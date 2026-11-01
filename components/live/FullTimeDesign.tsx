import type { FullTimeLayout, FullTimeText } from "@/config/fullTimeLayout";
import { Color, Num, Text, Toggle } from "./designControls";
import { useLang } from "@/lib/prefs";

interface Props {
  layout: FullTimeLayout;
  onChange: (next: FullTimeLayout) => void;
}

/** Every value the full-time poster reads, same as the other posters. */
export default function FullTimeDesign({ layout, onChange }: Props) {
  const { t } = useLang();
  const up = (fn: (n: FullTimeLayout) => void) => {
    const n: FullTimeLayout = structuredClone(layout);
    fn(n);
    onChange(n);
  };
  const T = layout.teams;
  const S = layout.scorers;

  const textBlock = (key: "title" | "subtitle" | "footer", name: string) => {
    const tx: FullTimeText = layout[key];
    return (
      <>
        <h4>{name}</h4>
        <Text label={t("النص (فارغ = تلقائي)", "Text (empty = automatic)")} value={tx.text ?? ""} onChange={(v) => up((n) => (n[key].text = v))} />
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

      {textBlock("title", t("العنوان"))}
      {textBlock("subtitle", t("العنوان الفرعي"))}

      <h4>{t("الفريقان والنتيجة")}</h4>
      <div className="grid">
        <Num label={t("موضعهما رأسياً")} value={T.y} onChange={(v) => up((n) => (n.teams.y = v))} />
        <Num label={t("حجم الشعار", "Crest size")} value={T.crestSize} onChange={(v) => up((n) => (n.teams.crestSize = v))} />
        <Num label={t("موضع المستضيف", "Home position")} value={T.nearX} onChange={(v) => up((n) => (n.teams.nearX = v))} />
        <Num label={t("موضع الضيف", "Away position")} value={T.farX} onChange={(v) => up((n) => (n.teams.farX = v))} />
        <Num label={t("حجم النتيجة", "Score size")} value={T.scoreFontSize} onChange={(v) => up((n) => (n.teams.scoreFontSize = v))} />
        <Color label={t("لون النتيجة", "Score colour")} value={T.scoreColor} onChange={(v) => up((n) => (n.teams.scoreColor = v))} />
        <Num label={t("حجم الاسم", "Name size")} value={T.nameFontSize} onChange={(v) => up((n) => (n.teams.nameFontSize = v))} />
        <Num label={t("مسافة الاسم", "Name offset")} value={T.nameDy} onChange={(v) => up((n) => (n.teams.nameDy = v))} />
        <Color label={t("لون الاسم", "Name colour")} value={T.nameColor} onChange={(v) => up((n) => (n.teams.nameColor = v))} />
        <Num label={t("حجم ركلات الترجيح", "Shootout size")} value={T.shootoutFontSize} onChange={(v) => up((n) => (n.teams.shootoutFontSize = v))} />
        <Num label={t("مسافة ركلات الترجيح", "Shootout offset")} value={T.shootoutDy} onChange={(v) => up((n) => (n.teams.shootoutDy = v))} />
        <Color label={t("لون ركلات الترجيح", "Shootout colour")} value={T.shootoutColor} onChange={(v) => up((n) => (n.teams.shootoutColor = v))} />
      </div>

      <h4>{t("الهدافون", "Scorers")}</h4>
      <div className="grid">
        <Toggle label={t("إظهار")} value={S.show} onChange={(v) => up((n) => (n.scorers.show = v))} />
        <Num label={t("موضع أول صف", "First row")} value={S.firstRowY} onChange={(v) => up((n) => (n.scorers.firstRowY = v))} />
        <Num label={t("ارتفاع الصف", "Row height")} value={S.rowHeight} onChange={(v) => up((n) => (n.scorers.rowHeight = v))} />
        <Num label={t("نهاية القائمة", "List ends at")} value={S.lastRowY} onChange={(v) => up((n) => (n.scorers.lastRowY = v))} />
        <Num label={t("موضع المستضيف", "Home position")} value={S.nearX} onChange={(v) => up((n) => (n.scorers.nearX = v))} />
        <Num label={t("موضع الضيف", "Away position")} value={S.farX} onChange={(v) => up((n) => (n.scorers.farX = v))} />
        <Num label={t("عرض العمود", "Column width")} value={S.columnWidth} onChange={(v) => up((n) => (n.scorers.columnWidth = v))} />
        <Num label={t("الحجم")} value={S.fontSize} onChange={(v) => up((n) => (n.scorers.fontSize = v))} />
        <Color label={t("اللون")} value={S.color} onChange={(v) => up((n) => (n.scorers.color = v))} />
        <Color label={t("لون الدقيقة", "Minute colour")} value={S.minuteColor} onChange={(v) => up((n) => (n.scorers.minuteColor = v))} />
      </div>

      {textBlock("footer", t("التذييل", "Footer"))}
    </details>
  );
}
