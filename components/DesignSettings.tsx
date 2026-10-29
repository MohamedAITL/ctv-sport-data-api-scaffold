import type { LayoutConfig } from "@/config/defaultLayout";
import { useLang } from "@/lib/prefs";

interface Props {
  layout: LayoutConfig;
  onChange: (next: LayoutConfig) => void;
}

function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={value} step={step} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="field check">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
// `columns` is a mode rather than a measurement: "auto" splits a big table
// into two or three columns on its own, and 1/2/3 force it.
function Columns({ value, onChange }: { value: LayoutConfig["table"]["columns"]; onChange: (v: LayoutConfig["table"]["columns"]) => void }) {
  const { t } = useLang();
  return (
    <label className="field wide">
      <span>{t("أعمدة الجدول")}</span>
      <select
        value={String(value)}
        onChange={(e) => onChange(e.target.value === "auto" ? "auto" : (Number(e.target.value) as 1 | 2 | 3))}
      >
        <option value="auto">{t("تلقائي")}</option>
        <option value="1">{t("عمود واحد")}</option>
        <option value="2">{t("عمودان")}</option>
        <option value="3">{t("ثلاثة أعمدة")}</option>
      </select>
    </label>
  );
}
function Text({ label, value, onChange, rtl }: { label: string; value: string; onChange: (v: string) => void; rtl?: boolean }) {
  return (
    <label className="field wide">
      <span>{label}</span>
      <input type="text" dir={rtl ? "rtl" : "ltr"} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

// Live layout controls. All values write back into LayoutConfig and persist.
export default function DesignSettings({ layout, onChange }: Props) {
  const { t } = useLang();
  const up = (fn: (n: LayoutConfig) => void) => {
    const n: LayoutConfig = structuredClone(layout);
    fn(n);
    onChange(n);
  };
  const T = layout.table;
  const Z = layout.zones;
  const M = layout.mask;

  return (
    <details className="card collapsible">
      <summary><h3>{t("التصميم")}</h3><span className="chev" /></summary>

      <h4>{t("الصفوف")}</h4>
      <div className="grid">
        <Num label={t("موضع أول صف")} value={T.firstRowCenterY} onChange={(v) => up((n) => (n.table.firstRowCenterY = v))} />
        <Num label={t("ارتفاع الصف")} value={T.rowHeight} step={0.5} onChange={(v) => up((n) => (n.table.rowHeight = v))} />
        <Num label={t("حجم الاسم")} value={T.fontSizeName} onChange={(v) => up((n) => (n.table.fontSizeName = v))} />
        <Num label={t("حجم الأرقام")} value={T.fontSizeStat} onChange={(v) => up((n) => (n.table.fontSizeStat = v))} />
        <Num label={t("حجم الترتيب")} value={T.fontSizeRank} onChange={(v) => up((n) => (n.table.fontSizeRank = v))} />
        <Num label={t("حجم الشعار")} value={T.logoSize} onChange={(v) => up((n) => (n.table.logoSize = v))} />
        <Color label={t("لون الاسم")} value={T.nameColor} onChange={(v) => up((n) => (n.table.nameColor = v))} />
      </div>

      <h4>{t("مواضع الأعمدة")}</h4>
      <div className="grid">
        <Num label={t("موضع النقاط")} value={T.pointsX} onChange={(v) => up((n) => (n.table.pointsX = v))} />
        <Num label={t("موضع «فاز»")} value={T.winsX} onChange={(v) => up((n) => (n.table.winsX = v))} />
        <Num label={t("موضع «لعب»")} value={T.playedX} onChange={(v) => up((n) => (n.table.playedX = v))} />
        <Num label={t("موضع الاسم")} value={T.nameRightX} onChange={(v) => up((n) => (n.table.nameRightX = v))} />
        <Num label={t("موضع الشعار")} value={T.logoCenterX} onChange={(v) => up((n) => (n.table.logoCenterX = v))} />
        <Num label={t("موضع الترتيب")} value={T.rankX} onChange={(v) => up((n) => (n.table.rankX = v))} />
      </div>

      <h4>{t("الأعمدة المتعددة (للجداول الكبيرة)")}</h4>
      <Columns value={T.columns} onChange={(v) => up((n) => (n.table.columns = v))} />
      <div className="grid">
        <Num label={t("بداية عمودين")} value={T.twoColFrom} onChange={(v) => up((n) => (n.table.twoColFrom = v))} />
        <Num label={t("بداية ثلاثة أعمدة")} value={T.threeColFrom} onChange={(v) => up((n) => (n.table.threeColFrom = v))} />
        <Num label={t("المسافة بين الأعمدة")} value={T.columnGap} onChange={(v) => up((n) => (n.table.columnGap = v))} />
        <Num label={t("تصغير عمودين")} value={T.twoColScale} step={0.05} onChange={(v) => up((n) => (n.table.twoColScale = v))} />
        <Num label={t("تصغير ثلاثة")} value={T.threeColScale} step={0.05} onChange={(v) => up((n) => (n.table.threeColScale = v))} />
        <Num label={t("بداية الصف أفقياً")} value={T.spanLeft} onChange={(v) => up((n) => (n.table.spanLeft = v))} />
        <Num label={t("نهاية الصف أفقياً")} value={T.spanRight} onChange={(v) => up((n) => (n.table.spanRight = v))} />
        <Num label={t("أصغر حجم خط")} value={T.minFontSize} onChange={(v) => up((n) => (n.table.minFontSize = v))} />
        <Num label={t("نهاية الجدول")} value={T.bottomY} onChange={(v) => up((n) => (n.table.bottomY = v))} />
      </div>

      <h4>{t("ألوان المناطق")}</h4>
      <div className="grid">
        <Num label={t("عدد الأعلى")} value={Z.topCount} onChange={(v) => up((n) => (n.zones.topCount = v))} />
        <Num label={t("عدد الأسفل")} value={Z.bottomCount} onChange={(v) => up((n) => (n.zones.bottomCount = v))} />
        <Color label={t("الأعلى")} value={Z.topColor} onChange={(v) => up((n) => (n.zones.topColor = v))} />
        <Color label={t("الوسط")} value={Z.midColor} onChange={(v) => up((n) => (n.zones.midColor = v))} />
        <Color label={t("الأسفل")} value={Z.bottomColor} onChange={(v) => up((n) => (n.zones.bottomColor = v))} />
      </div>

      <h4>{t("تغطية الصفوف القديمة")}</h4>
      <div className="grid">
        <Num label="X" value={M.x} onChange={(v) => up((n) => (n.mask.x = v))} />
        <Num label="Y" value={M.y} onChange={(v) => up((n) => (n.mask.y = v))} />
        <Num label={t("العرض")} value={M.w} onChange={(v) => up((n) => (n.mask.w = v))} />
        <Num label={t("الارتفاع")} value={M.h} onChange={(v) => up((n) => (n.mask.h = v))} />
        <Num label={t("الاستدارة")} value={M.radius} onChange={(v) => up((n) => (n.mask.radius = v))} />
        <Num label={t("الشفافية")} value={M.opacity} step={0.02} onChange={(v) => up((n) => (n.mask.opacity = v))} />
        <Color label={t("اللون")} value={M.color} onChange={(v) => up((n) => (n.mask.color = v))} />
      </div>

      <h4>{t("عناصر إضافية (أطفئها للإبقاء على نص القالب)")}</h4>
      <div className="grid">
        <Toggle label={t("العنوان")} value={layout.heading.show} onChange={(v) => up((n) => (n.heading.show = v))} />
        <Toggle label={t("عناوين الأعمدة")} value={layout.columnHeaders.show} onChange={(v) => up((n) => (n.columnHeaders.show = v))} />
        <Toggle label={t("سطر الموسم")} value={layout.seasonLabel.show} onChange={(v) => up((n) => (n.seasonLabel.show = v))} />
        <Toggle label={t("سطر التحديث")} value={layout.updatedLabel.show} onChange={(v) => up((n) => (n.updatedLabel.show = v))} /> <Toggle label={t("تغطية الصفوف")} value={layout.mask.show} onChange={(v) => up((n) => (n.mask.show = v))} />
      </div>
      {layout.heading.show && (
        <>
          <Text label={t("نص العنوان")} rtl value={layout.heading.text || ""} onChange={(v) => up((n) => (n.heading.text = v))} />
          <div className="grid">
            <Num label={t("حجم العنوان")} value={layout.heading.fontSize} onChange={(v) => up((n) => (n.heading.fontSize = v))} />
            <Num label={t("موضعه أفقياً")} value={layout.heading.x} onChange={(v) => up((n) => (n.heading.x = v))} />
            <Num label={t("موضعه رأسياً")} value={layout.heading.y} onChange={(v) => up((n) => (n.heading.y = v))} />
            <Color label={t("لون العنوان")} value={layout.heading.color} onChange={(v) => up((n) => (n.heading.color = v))} />
          </div>
        </>
      )}
      {layout.columnHeaders.show && (
        <div className="grid">
          <Num label={t("موضع عناوين الأعمدة")} value={layout.columnHeaders.y} onChange={(v) => up((n) => (n.columnHeaders.y = v))} />
          <Num label={t("حجم عناوين الأعمدة")} value={layout.columnHeaders.fontSize} onChange={(v) => up((n) => (n.columnHeaders.fontSize = v))} />
          <Color label={t("لون عناوين الأعمدة")} value={layout.columnHeaders.color} onChange={(v) => up((n) => (n.columnHeaders.color = v))} />
        </div>
      )}
      {layout.seasonLabel.show && (
        <>
          <Text label={t("نص الموسم")} rtl value={layout.seasonLabel.text || ""} onChange={(v) => up((n) => (n.seasonLabel.text = v))} />
          <div className="grid">
            <Num label={t("حجم الموسم")} value={layout.seasonLabel.fontSize} onChange={(v) => up((n) => (n.seasonLabel.fontSize = v))} />
            <Num label={t("موضع الموسم أفقياً")} value={layout.seasonLabel.x} onChange={(v) => up((n) => (n.seasonLabel.x = v))} />
            <Num label={t("موضع الموسم رأسياً")} value={layout.seasonLabel.y} onChange={(v) => up((n) => (n.seasonLabel.y = v))} />
            <Color label={t("لون الموسم")} value={layout.seasonLabel.color} onChange={(v) => up((n) => (n.seasonLabel.color = v))} />
          </div>
        </>
      )}
      {layout.updatedLabel.show && (
        <>
          <Text label={t("نص التحديث")} rtl value={layout.updatedLabel.text || ""} onChange={(v) => up((n) => (n.updatedLabel.text = v))} />
          <div className="grid">
            <Num label={t("حجم التحديث")} value={layout.updatedLabel.fontSize} onChange={(v) => up((n) => (n.updatedLabel.fontSize = v))} />
            <Num label={t("موضع التحديث أفقياً")} value={layout.updatedLabel.x} onChange={(v) => up((n) => (n.updatedLabel.x = v))} />
            <Num label={t("موضع التحديث رأسياً")} value={layout.updatedLabel.y} onChange={(v) => up((n) => (n.updatedLabel.y = v))} />
            <Color label={t("لون التحديث")} value={layout.updatedLabel.color} onChange={(v) => up((n) => (n.updatedLabel.color = v))} />
          </div>
        </>
      )}
    </details>
  );
}
