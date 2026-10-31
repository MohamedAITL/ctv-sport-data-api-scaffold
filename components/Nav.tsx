import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import PrefsToggle from "./PrefsToggle";
import Icon from "./Icon";
import { useLang } from "@/lib/prefs";

export default function Nav() {
  const { pathname } = useRouter();
  const { t } = useLang();
  const nav = useRef<HTMLElement>(null);
  // An article (/news/[id]) still belongs to the news tab.
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  // On a phone the tabs scroll sideways; keep the current one in view.
  useEffect(() => {
    nav.current?.querySelector<HTMLElement>(".navlink.active")?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [pathname]);
  const link = (href: string, label: string, icon: Parameters<typeof Icon>[0]["name"]) => (
    <Link href={href} className={isActive(href) ? "navlink active" : "navlink"}><Icon name={icon} />{label}</Link>
  );
  // The switches sit beside the nav, not in it: on a phone the nav scrolls
  // sideways and would hide them off the edge.
  return (
    <>
    <nav className="nav" ref={nav}>
      {link("/", t("الترتيب", "Standings"), "standings")}
      {link("/round", t("الجولة", "Round"), "round")}
      {link("/matchday", t("مباريات اليوم", "Matchday"), "matchday")}
      {link("/stats", t("الإحصائيات", "Stats"), "stats")}
      {link("/news", t("الأخبار", "News"), "news")}
      {link("/live", t("المباشر", "Live"), "live")}
    </nav>
    <PrefsToggle />
    </>
  );
}
