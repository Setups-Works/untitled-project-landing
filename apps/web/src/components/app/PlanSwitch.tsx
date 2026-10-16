"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** The pages that share the "Plan" tab. Each keeps its own address, so links from search, chat and the calendar still land on it. */
const PAGES = [
  { href: "/dashboard/todo", t: "To-do" },
  { href: "/dashboard/notes", t: "Notes" },
  { href: "/dashboard/calendar", t: "Calendar" },
] as const;

/** Pill switch between To-do, Notes and Calendar at the top of each page, styled like the top-bar section switcher. */
export default function PlanSwitch() {
  const path = usePathname();
  return (
    <nav aria-label="Plan" className="mb-4 flex justify-center">
      <div className="inline-flex gap-1 rounded-pill bg-surface p-[5px] shadow-[inset_0_0_0_1px_var(--line)]">
        {PAGES.map((p) => {
          const on = path.startsWith(p.href);
          return (
            <Link
              key={p.href}
              href={p.href}
              aria-current={on ? "page" : undefined}
              className={`rounded-pill px-5 py-2 text-[14px] font-medium transition-colors ${on ? "bg-fill-dark text-on-dark" : "text-fg-muted hover:text-fg"}`}
            >
              {p.t}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
