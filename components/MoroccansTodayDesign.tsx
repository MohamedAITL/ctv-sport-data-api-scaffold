import type { MoroccansTodayLayout } from "@/config/moroccansTodayLayout";
import { Color, Num, Text, Toggle } from "./live/designControls";
import PlayerSpotlightDesign from "./PlayerSpotlightDesign";
import { useLang } from "@/lib/prefs";

interface Props {
  layout: MoroccansTodayLayout;
  onChange: (next: MoroccansTodayLayout) => void;
}

type RKey = keyof Omit<MoroccansTodayLayout["rows"], "card">;

/** Every value the Moroccans-today poster reads. */
export default function MoroccansTodayDesign({ layout, onChange }: Props) {
  const { t } = useLang();
  const up = (fn: (n: MoroccansTodayLayout) => void) => {
    const n: MoroccansTodayLayout = structuredClone(layout);
    fn(n);
    onChange(n);
  };
  const R = layout.rows;
  const C = R.card;
  const rNum = (k: RKey, label: string) => <Num key={k} label={label} value={R[k] as number} onChange={(v) => up((n) => { (n.rows[k] as number) = v; })} />;
  const rColor = (k: RKey, label: string) => <Color key={k} label={label} value={R[k] as string} onChange={(v) => up((n) => { (n.rows[k] as string) = v; })} />;

  const textBlock = (key: "title" | "subtitle" | "footer", name: string) => {
    const tx = layout[key];
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

      <h4>{t("الصفوف", "Rows")}</h4>
      <div className="grid">
        {rNum("firstRowY", t("موضع أول صف", "First row"))}
        {rNum("rowHeight", t("ارتفاع الصف", "Row height"))}
        {rNum("lastRowY", t("نهاية القائمة", "List ends at"))}
        <Toggle label={t("إظهار البطاقة", "Show card")} value={C.show} onChange={(v) => up((n) => (n.rows.card.show = v))} />
        <Num label={t("ارتفاع البطاقة", "Card height")} value={C.height} onChange={(v) => up((n) => (n.rows.card.height = v))} />
        <Num label={t("الهامش الجانبي", "Side margin")} value={C.insetX} onChange={(v) => up((n) => (n.rows.card.insetX = v))} />
        <Num label={t("الاستدارة", "Corner radius")} value={C.radius} onChange={(v) => up((n) => (n.rows.card.radius = v))} />
        <Num label={t("الشفافية", "Opacity")} step={0.05} value={C.opacity} onChange={(v) => up((n) => (n.rows.card.opacity = v))} />
        <Color label={t("لون البطاقة", "Card colour")} value={C.color} onChange={(v) => up((n) => (n.rows.card.color = v))} />
      </div>

      <h4>{t("اللاعب", "Player")}</h4>
      <div className="grid">
        {rNum("faceX", t("موضع الصورة", "Photo position"))}
        {rNum("faceSize", t("حجم الصورة", "Photo size"))}
        {rColor("ringColor", t("لون الإطار", "Ring colour"))}
        {rNum("clubSize", t("حجم الشعار", "Crest size"))}
        {rNum("nameRightX", t("موضع الاسم", "Name position"))}
        {rNum("nameDy", t("مسافة الاسم", "Name offset"))}
        {rNum("nameFontSize", t("حجم الاسم", "Name size"))}
        {rColor("nameColor", t("لون الاسم", "Name colour"))}
        {rNum("metaDy", t("مسافة المباراة", "Match offset"))}
        {rNum("metaFontSize", t("حجم المباراة", "Match size"))}
        {rColor("metaColor", t("لون المباراة", "Match colour"))}
      </div>

      <h4>{t("الأرقام", "Figures")}</h4>
      <div className="grid">
        {rNum("chipLeftX", t("الموضع", "Position"))}
        {rNum("chipFontSize", t("الحجم"))}
        {rNum("chipRadius", t("الاستدارة", "Corner radius"))}
        {rColor("chipColor", t("اللون"))}
        {rColor("chipBg", t("لون الخلفية", "Background colour"))}
      </div>

      <PlayerSpotlightDesign layout={layout.player} onChange={(v) => up((n) => { n.player = v; })} />

      {textBlock("footer", t("التذييل", "Footer"))}
    </details>
  );
}
