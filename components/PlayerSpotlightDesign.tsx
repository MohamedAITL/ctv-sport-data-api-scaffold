import type { PlayerSpotlightLayout } from "@/config/playerSpotlight";
import { Color, Num } from "./live/designControls";
import { useLang } from "@/lib/prefs";

type Key = keyof PlayerSpotlightLayout;

/** The one-player poster's controls, shared by both Moroccan posters. */
export default function PlayerSpotlightDesign({ layout, onChange }: { layout: PlayerSpotlightLayout; onChange: (next: PlayerSpotlightLayout) => void }) {
  const { t } = useLang();
  const num = (k: Key, ar: string, en: string, step?: number) => (
    <Num key={k} label={t(ar, en)} step={step} value={layout[k] as number} onChange={(v) => onChange({ ...layout, [k]: v })} />
  );
  const color = (k: Key, ar: string, en: string) => (
    <Color key={k} label={t(ar, en)} value={layout[k] as string} onChange={(v) => onChange({ ...layout, [k]: v })} />
  );

  return (
    <>
      <h4>{t("البطاقة الفردية (لاعب واحد)", "Single player poster")}</h4>
      <div className="grid">
        {num("titleY", "موضع العنوان", "Title position")}
        {num("titleFontSize", "حجم العنوان", "Title size")}
        {color("titleColor", "لون العنوان", "Title colour")}
        {num("subtitleY", "موضع العنوان الفرعي", "Subtitle position")}
        {num("subtitleFontSize", "حجم العنوان الفرعي", "Subtitle size")}
        {color("subtitleColor", "لون العنوان الفرعي", "Subtitle colour")}
        {num("faceY", "موضع الصورة", "Photo position")}
        {num("faceSize", "حجم الصورة", "Photo size")}
        {num("ringWidth", "سمك الإطار", "Ring width")}
        {color("ringColor", "لون الإطار", "Ring colour")}
        {num("clubSize", "حجم شعار النادي", "Crest size")}
        {num("nameY", "موضع الاسم", "Name position")}
        {num("nameFontSize", "حجم الاسم", "Name size")}
        {color("nameColor", "لون الاسم", "Name colour")}
        {num("chipY", "موضع سطر المباراة", "Match line position")}
        {num("chipFontSize", "حجم سطر المباراة", "Match line size")}
        {color("chipColor", "لون سطر المباراة", "Match line colour")}
        {color("chipBg", "خلفية سطر المباراة", "Match line background")}
      </div>
      <h4>{t("خانات الأرقام", "Stat tiles")}</h4>
      <div className="grid">
        {num("statsTop", "بداية الخانات", "Tiles start")}
        {num("statsBottom", "نهاية الخانات", "Tiles end")}
        {num("statsInsetX", "الهامش الجانبي", "Side margin")}
        {num("tileGap", "المسافة بين الخانات", "Gap between tiles")}
        {num("tileMaxHeight", "أقصى ارتفاع للخانة", "Tallest tile")}
        {num("tileRadius", "الاستدارة", "Corner radius")}
        {num("tileOpacity", "الشفافية", "Opacity", 0.05)}
        {color("tileColor", "لون الخانة", "Tile colour")}
        {num("valueFontSize", "حجم الرقم", "Figure size")}
        {color("valueColor", "لون الرقم", "Figure colour")}
        {num("labelFontSize", "حجم الإحصائية", "Stat name size")}
        {color("labelColor", "لون الإحصائية", "Stat name colour")}
        {num("noteFontSize", "حجم سطر الترتيب", "Rank line size")}
        {color("noteColor", "لون سطر الترتيب", "Rank line colour")}
      </div>
    </>
  );
}
