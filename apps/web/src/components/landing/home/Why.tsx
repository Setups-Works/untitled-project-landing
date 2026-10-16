"use client";
import { useRef } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faBookOpen, faCalendarDays, faComments, faListCheck, faMagnifyingGlass, faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import Glass from "../Glass";
import { Eyebrow, Lead, Section, Title } from "../Kit";
import { showNow, useMotion } from "../motion";
import { R, Reveal } from "../Reveal";
import type { Tone } from "../../../lib/tones";
import { BrandMark } from "../../BrandMark";

// Where each scattered app starts (px offset and tilt from its final place in the grid). Fixed, so the layout is the same on every visit.
const APPS: { icon: IconDefinition; t: string; tone: Tone; from: [number, number, number] }[] = [
  { icon: faPenToSquare, t: "A notes app", tone: "blue", from: [-150, -110, -14] },
  { icon: faListCheck, t: "A to-do app", tone: "amber", from: [170, -80, 11] },
  { icon: faBookOpen, t: "A journal app", tone: "violet", from: [-190, 20, 9] },
  { icon: faCalendarDays, t: "A calendar", tone: "green", from: [200, 40, -12] },
  { icon: faComments, t: "An AI chat tab", tone: "mint", from: [-120, 130, -8] },
  { icon: faMagnifyingGlass, t: "A search that finds one of them", tone: "gold", from: [140, 140, 13] },
];

const BENEFITS: [string, string][] = [
  ["One search", "Press ⌘K and look across your tasks, notes, journal and chats at once."],
  ["One calendar", "Your tasks sit on the same calendar as your events."],
  ["One place for AI", "Chat with the model you choose, beside the work it is about."],
];

/**
 * Scattered single-purpose apps, tilted and spread out, slide into a single glass card as you scroll (a scrubbed ScrollTrigger
 * timeline). The motion is the argument: your work is in six places, and it should be in one.
 */
export default function Why() {
  const stage = useRef<HTMLDivElement>(null);
  useMotion(stage, ({ g, root, calm }) => {
    const chips = root.querySelectorAll<HTMLElement>("[data-app]");
    const card = root.querySelector<HTMLElement>("[data-merged]");
    const label = root.querySelector<HTMLElement>("[data-label]");
    if (calm || !card) return void showNow(g, [...chips, card, label]);
    const tl = g.timeline({ scrollTrigger: { trigger: root, start: "top 80%", end: "center 45%", scrub: 1 } });
    // Phones are narrow: keep the starting spread on screen.
    const spread = window.innerWidth < 640 ? 0.4 : 1;
    chips.forEach((el, i) => {
      const [x, y, r] = APPS[i].from;
      tl.fromTo(el, { x: x * spread, y: y * spread, rotation: r }, { x: 0, y: 0, rotation: 0, ease: "power2.inOut", duration: 1 }, 0);
    });
    tl.fromTo(card, { autoAlpha: 0, scale: 0.88 }, { autoAlpha: 1, scale: 1, ease: "power2.out", duration: 0.7 }, 0.45);
    tl.fromTo(label, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.8);
  });

  return (
    <Section>
      <div className="grid items-center gap-[clamp(32px,6vw,80px)] lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col items-start gap-5">
          <Reveal>
            <Eyebrow>The problem</Eyebrow>
          </Reveal>
          <Title quiet="It should be in one.">Your work is in six places.</Title>
          <Reveal delay={150}>
            <Lead>
              A note in one app, the task it created in another, the plan on a calendar, the thinking in a chat tab. Every hop costs you the
              context you were holding.
            </Lead>
          </Reveal>
          <Reveal stagger={0.1} className="mt-3 flex flex-col gap-3">
            {BENEFITS.map(([t, d]) => (
              <R key={t} className="flex gap-3.5">
                <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-green-fg shadow-[0_0_0_4px_var(--green-bg)]" />
                <p className="text-[15.5px] leading-relaxed text-fg-muted">
                  <b className="font-semibold text-fg">{t}.</b> {d}
                </p>
              </R>
            ))}
          </Reveal>
        </div>

        <div ref={stage} className="relative mx-auto w-full max-w-[560px]">
          <Glass radius="r5" glare tilt data-merged-wrap className="relative p-[clamp(18px,3vw,32px)]">
            <div
              data-merged
              data-reveal
              className="absolute inset-2 -z-0 rounded-r4 bg-green-fg/[0.07] opacity-0 shadow-[inset_0_0_0_1px_var(--green-line)]"
            />
            <div className="relative grid grid-cols-2 gap-3">
              {APPS.map((a) => (
                <div key={a.t} data-app>
                  <Glass variant="flat" radius="r3" tone={a.tone} className="flex items-center gap-3 px-3.5 py-4 sm:px-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-r1 bg-white/70 text-[14px] text-(--abf)">
                      <FA icon={a.icon} />
                    </span>
                    <span className="text-[13.5px] leading-tight font-medium text-fg">{a.t}</span>
                  </Glass>
                </div>
              ))}
            </div>
            <div data-label data-reveal className="relative mt-5 flex items-center justify-center gap-2.5 opacity-0">
              <BrandMark size={34} />
              <span className="font-serif text-[24px] tracking-[-0.02em] text-fg">untitled project</span>
            </div>
          </Glass>
        </div>
      </div>
    </Section>
  );
}
