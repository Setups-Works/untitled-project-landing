"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faChartPie, faUsers, faArrowLeft, faChartColumn, faBullhorn, faClipboardList } from "@fortawesome/free-solid-svg-icons";

/** Add a line here for every new admin section — pages live in app/admin/<section>. */
const SECTIONS = [
  { href: "/admin", t: "Overview", icon: faChartPie },
  { href: "/admin/users", t: "Users", icon: faUsers },
  { href: "/admin/usage", t: "Usage", icon: faChartColumn },
  { href: "/admin/announcements", t: "Announcements", icon: faBullhorn },
  { href: "/admin/audit", t: "Audit log", icon: faClipboardList },
];

export default function AdminNav({ email }: { email: string }) {
  const path = usePathname();
  return (
    <aside className="adm-side">
      <div className="eyebrow">Admin</div>
      <nav aria-label="Admin">
        {SECTIONS.map((s) => {
          const on = s.href === "/admin" ? path === "/admin" : path.startsWith(s.href);
          return (
            <Link key={s.href} href={s.href} aria-current={on ? "page" : undefined}>
              <FA icon={s.icon} /> {s.t}
            </Link>
          );
        })}
      </nav>
      <div className="adm-foot">
        <small>{email}</small>
        <Link href="/dashboard"><FA icon={faArrowLeft} /> Back to app</Link>
      </div>
    </aside>
  );
}
