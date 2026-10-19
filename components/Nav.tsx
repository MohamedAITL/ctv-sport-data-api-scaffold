import Link from "next/link";
import { useRouter } from "next/router";

export default function Nav() {
  const { pathname } = useRouter();
  const link = (href: string, label: string) => (
    <Link href={href} className={pathname === href ? "navlink active" : "navlink"}>{label}</Link>
  );
  return (
    <nav className="nav">
      {link("/", "Standings")}
      {link("/round", "Round")}
      {link("/matchday", "Matchday")}
      {link("/stats", "Stats")}
    </nav>
  );
}
