import Link from "next/link";
import type { ReactNode } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import AuthLink from "./auth/AuthLink";
import Glass from "./landing/Glass";
import { BTN_GHOST_DARK, BTN_LIGHT, Eyebrow, IconTile, Lead, Section, SectionHead as Head, Title, WRAP } from "./landing/Kit";
import { Magnetic } from "./landing/Magnetic";
import { Parallax } from "./landing/Parallax";
import { R, Reveal } from "./landing/Reveal";
import { isTone, type Tone } from "../lib/tones";

export { Head as SectionHead };

/** Page-top banner shared by every marketing page: a label, the serif headline, a lead and the calls to action. */
export function PageHero({
  eyebrow,
  title,
  quiet,
  lead,
  status,
  children,
}: {
  eyebrow: string;
  title: string;
  quiet?: string;
  lead: string;
  /** Honest label for pages that describe something not fully built yet. */
  status?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pt-[clamp(56px,9vw,128px)] pb-[clamp(36px,5vw,64px)] text-center">
      {/* Two glass lenses drifting at different depths — decoration only. */}
      <Parallax speed={-90} className="pointer-events-none absolute top-[14%] left-[7%] hidden lg:block">
        <Glass radius="pill" className="size-28 animate-float opacity-80 motion-reduce:animate-none" />
      </Parallax>
      <Parallax speed={110} className="pointer-events-none absolute right-[8%] bottom-[8%] hidden lg:block">
        <Glass radius="pill" className="size-20 animate-float-slow opacity-80 motion-reduce:animate-none" />
      </Parallax>
      <div className={`${WRAP} relative flex flex-col items-center`}>
        <Reveal className="flex flex-wrap items-center justify-center gap-2.5">
          <Eyebrow>{eyebrow}</Eyebrow>
          {status}
        </Reveal>
        <Title as="h1" size="display" onLoad className="mt-6 max-w-[940px]" quiet={quiet}>
          {title}
        </Title>
        <Reveal delay={600} className="mt-6">
          <Lead className="mx-auto">{lead}</Lead>
        </Reveal>
        {children && (
          <Reveal delay={800} className="mt-9">
            <div className="flex flex-wrap items-center justify-center gap-3">{children}</div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

export function FeatureCards({
  items,
  cols = 3,
}: {
  items: { icon: IconDefinition; t: string; d: string; tone?: Tone | string }[];
  cols?: 2 | 3 | 4;
}) {
  const grid = cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <Reveal stagger={0.09} className={`mt-[clamp(28px,4vw,48px)] grid gap-4 ${grid}`}>
      {items.map((x) => {
        const tone = String(x.tone ?? "").replace(/^tone-/, "");
        return (
          <R key={x.t}>
            <Glass
              variant="flat"
              radius="r3"
              tone={isTone(tone) ? tone : "sand"}
              glare
              tilt
              lift
              className="flex h-full flex-col gap-3 p-6"
            >
              <IconTile icon={x.icon} />
              <h3 className="mt-1 text-[17px] font-semibold tracking-[-0.01em] text-fg">{x.t}</h3>
              <p className="text-[15px] leading-relaxed text-fg-muted">{x.d}</p>
            </Glass>
          </R>
        );
      })}
    </Reveal>
  );
}

/** The closing call to action: a smoked-glass panel with the headline and one or two buttons. */
export function CtaPanel({
  title,
  quiet,
  lead,
  primary = ["Get started", "/signup"],
  secondary,
}: {
  title: string;
  quiet?: string;
  lead: string;
  primary?: [string, string];
  secondary?: [string, string];
}) {
  return (
    <Section>
      <Reveal>
        <Glass variant="dark" radius="r5" className="overflow-hidden px-6 py-[clamp(44px,7vw,92px)] text-center">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 -z-10 size-[420px] -translate-x-1/2 rounded-full bg-green-fg/40 blur-[90px]"
          />
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
            <Title dark quiet={quiet}>
              {title}
            </Title>
            <Lead dark className="mx-auto">
              {lead}
            </Lead>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <Magnetic>
                {primary[1] === "/signup" ? (
                  <AuthLink arrow className={BTN_LIGHT}>
                    {primary[0]}
                  </AuthLink>
                ) : (
                  <Link className={BTN_LIGHT} href={primary[1]}>
                    {primary[0]} <FA icon={faArrowRight} />
                  </Link>
                )}
              </Magnetic>
              {secondary && (
                <Link className={BTN_GHOST_DARK} href={secondary[1]}>
                  {secondary[0]}
                </Link>
              )}
            </div>
          </div>
        </Glass>
      </Reveal>
    </Section>
  );
}
