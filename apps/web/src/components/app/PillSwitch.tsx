"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type PillPage = {
  href: string;
  t: string;
  /** Whether this page is the open one, given the current address. */
  match: (path: string) => boolean;
  /** A small count shown next to the name (for example invitations waiting). */
  badge?: number;
};

/** Pill switch between sibling pages at the top of a page, styled like the top-bar section switcher. Each page keeps its own address. */
export default function PillSwitch({ label, pages }: { label: string; pages: readonly PillPage[] }) {
  const path = usePathname();
  return (
    <nav aria-label={label} className="mb-4 flex justify-center">
      <div className="inline-flex gap-1 rounded-pill bg-surface p-[5px] shadow-[inset_0_0_0_1px_var(--line)]">
        {pages.map((p) => {
          const on = p.match(path);
          return (
            <Link
              key={p.href}
              href={p.href}
              aria-current={on ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-pill px-5 py-2 text-[14px] font-medium transition-colors ${on ? "bg-fill-dark text-on-dark" : "text-fg-muted hover:text-fg"}`}
            >
              {p.t}
              {!!p.badge && (
                <span className="at-amber tint rounded-pill px-2 py-px text-[11px] font-semibold" aria-label={`${p.badge} waiting`}>
                  {p.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
