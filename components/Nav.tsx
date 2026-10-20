import Link from "next/link";
import { useRouter } from "next/router";

export default function Nav() {
  const { pathname } = useRouter();
  const link = (href: string, label: string) => (
    <Link href={href} className={pathname === href ? "navlink active" : "navlink"}>{label}</Link>
  );
  return (
    <nav className="nav">
      {link("/", "الترتيب")}
      {link("/round", "الجولة")}
      {link("/matchday", "مباريات اليوم")}
      {link("/stats", "الإحصائيات")}
      {link("/news", "الأخبار")}
      {link("/live", "المباشر")}
    </nav>
  );
}
