import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

export default function Nav() {
  const { pathname } = useRouter();
  const nav = useRef<HTMLElement>(null);
  // An article (/news/[id]) still belongs to the news tab.
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  // On a phone the tabs scroll sideways; keep the current one in view.
  useEffect(() => {
    nav.current?.querySelector<HTMLElement>(".navlink.active")?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [pathname]);
  const link = (href: string, label: string) => (
    <Link href={href} className={isActive(href) ? "navlink active" : "navlink"}>{label}</Link>
  );
  return (
    <nav className="nav" ref={nav}>
      {link("/", "الترتيب")}
      {link("/round", "الجولة")}
      {link("/matchday", "مباريات اليوم")}
      {link("/stats", "الإحصائيات")}
      {link("/news", "الأخبار")}
      {link("/live", "المباشر")}
    </nav>
  );
}
