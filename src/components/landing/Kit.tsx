import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import type { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { Title } from "./Title";

export { Title };

/** Centered page column used by every marketing section. */
export const WRAP = "mx-auto w-full max-w-(--container) px-(--gutter)";

export function Section({
  id,
  children,
  className = "",
  tight = false,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tight?: boolean;
}) {
  return (
    <section id={id} className={`relative scroll-mt-24 ${tight ? "pb-[clamp(40px,5vw,72px)]" : "py-[clamp(44px,6vw,88px)]"} ${className}`}>
      <div className={WRAP}>{children}</div>
    </section>
  );
}

/** Small glass pill used as a section label. */
export function Eyebrow({ children, icon, dark = false }: { children: ReactNode; icon?: IconDefinition; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-pill px-3.5 py-1.5 text-[12.5px] font-medium tracking-[0.02em] ${
        dark ? "liquid-dark text-on-dark/80" : "liquid-pill text-fg-muted"
      }`}
    >
      {icon && <FA icon={icon} className={dark ? "text-on-dark" : "text-green-fg"} />}
      {children}
    </span>
  );
}

export const Lead = ({ children, className = "", dark = false }: { children: ReactNode; className?: string; dark?: boolean }) => (
  <p
    className={`max-w-[640px] text-[clamp(16px,1.6vw,19px)] leading-relaxed text-pretty ${dark ? "text-on-dark/70" : "text-fg-muted"} ${className}`}
  >
    {children}
  </p>
);

export function SectionHead({
  eyebrow,
  title,
  quiet,
  lead,
  align = "center",
  dark = false,
  icon,
}: {
  eyebrow?: string;
  title: string;
  quiet?: string;
  lead?: ReactNode;
  align?: "center" | "left";
  dark?: boolean;
  icon?: IconDefinition;
}) {
  const c = align === "center";
  return (
    <div className={`flex flex-col gap-4 ${c ? "items-center text-center" : "items-start text-left"}`}>
      {eyebrow && (
        <Reveal>
          <Eyebrow icon={icon} dark={dark}>
            {eyebrow}
          </Eyebrow>
        </Reveal>
      )}
      <Title quiet={quiet} dark={dark}>
        {title}
      </Title>
      {lead && (
        <Reveal delay={150}>
          <Lead dark={dark} className={c ? "mx-auto" : ""}>
            {lead}
          </Lead>
        </Reveal>
      )}
    </div>
  );
}

/** Button looks for use on the smoked-glass panels, where the dark `btn-primary` would disappear. */
export const BTN_LIGHT =
  "inline-flex h-[52px] items-center justify-center gap-2 rounded-pill bg-white px-6 text-[15px] font-medium text-fg shadow-e2 transition-[transform,box-shadow] duration-300 hover:-translate-y-px active:scale-95";
export const BTN_GHOST_DARK =
  "inline-flex h-[52px] items-center justify-center gap-2 rounded-pill bg-white/10 px-6 text-[15px] font-medium text-on-dark shadow-[inset_0_0_0_1px_var(--liquid-ghost)] backdrop-blur-md transition-[transform,background-color] duration-300 hover:bg-white/20 active:scale-95";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid h-7 min-w-7 place-items-center rounded-r1 bg-white/80 px-2 font-mono text-[12px] text-fg shadow-glass">
      {children}
    </kbd>
  );
}

const STATUS = {
  live: { label: "Live", cls: "bg-green-bg text-green-fg", tip: "You can use this today." },
  building: { label: "Building", cls: "bg-amber-bg text-amber-fg", tip: "In development now." },
  soon: { label: "Coming soon", cls: "bg-surface-sunken text-fg-muted", tip: "Planned. Not available yet." },
} as const;
export type Status = keyof typeof STATUS;
export const statusTip = (s: Status) => STATUS[s].tip;

/** Honest status of a capability: shipped today, being built, or planned. */
export function StatusChip({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-[11.5px] font-medium ${s.cls}`}>
      <i className="size-1.5 rounded-full bg-current" aria-hidden />
      {s.label}
    </span>
  );
}

/** Round icon tile that sits on a tinted card (reads the card's `at-<tint>` variables). */
export function IconTile({ icon, className = "" }: { icon: IconDefinition; className?: string }) {
  return (
    <span
      className={`grid size-11 shrink-0 place-items-center rounded-r2 bg-white/60 text-[17px] text-(--abf) shadow-[inset_0_0_0_1px_var(--abl)] ${className}`}
    >
      <FA icon={icon} />
    </span>
  );
}
