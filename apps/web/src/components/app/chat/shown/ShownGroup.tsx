import Link from "next/link";
import type { ReactNode } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import type { Tone } from "../../../../lib/tones";

/**
 * One group of cards a chat reply asked the app to show: a tinted glass card with a title, the items, and an Open button that goes to
 * the real page. The tint is the same one that area uses everywhere (journal violet, to-dos amber, notes blue, health mint).
 */
export default function ShownGroup({
  tone,
  icon,
  title,
  openLabel,
  openHref,
  note,
  children,
}: {
  tone: Tone;
  icon: IconDefinition;
  title: string;
  openLabel: string;
  openHref: string;
  /** A small line under the items, for example "2 more". */
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className={`at-${tone} mt-3 rounded-r2 bg-(--ab) p-3.5 text-fg shadow-[inset_0_0_0_1px_var(--abl)]`} aria-label={title}>
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-(--abf) uppercase">
        <span className="grid size-7 place-items-center rounded-full bg-white/70 text-[12px] shadow-[inset_0_0_0_1px_var(--abl)]">
          <FA icon={icon} />
        </span>
        {title}
      </p>
      <ul className="mt-2.5 flex flex-col gap-2">{children}</ul>
      {note && <p className="mt-2 text-[12.5px] text-fg-subtle">{note}</p>}
      <Link href={openHref} className="btn btn-secondary btn-sm mt-3 inline-flex h-9 px-4 text-[13px]">
        {openLabel} <FA icon={faArrowRight} aria-hidden />
      </Link>
    </section>
  );
}

/** One row inside a group: a glass strip with the item's text and its own Open link. */
export function ShownRow({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        aria-label={label}
        className="flex flex-col gap-0.5 rounded-r1 bg-white/65 px-3 py-2 transition-colors hover:bg-white/85"
      >
        {children}
      </Link>
    </li>
  );
}

export const ShownEmpty = ({ children }: { children: ReactNode }) => (
  <li className="rounded-r1 bg-white/55 px-3 py-2 text-[13.5px] text-fg-muted">{children}</li>
);
