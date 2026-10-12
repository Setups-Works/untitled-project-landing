"use client";
import { useRef } from "react";
import Glass from "../Glass";
import { ROADMAP } from "../content";
import { Section, SectionHead, StatusChip, statusTip } from "../Kit";
import { showNow, useMotion } from "../motion";
import { Tip } from "../Tip";

/**
 * Where the product is and where it is going. A line draws itself down the page as you scroll and each milestone pops in when
 * the line reaches it. Statuses come from content.ts and must match docs/CURRENT_STATE.md.
 */
export default function Roadmap() {
  const wrap = useRef<HTMLDivElement>(null);
  useMotion(wrap, ({ g, root, calm }) => {
    const line = root.querySelector<HTMLElement>("[data-line]");
    const items = root.querySelectorAll<HTMLElement>("[data-step]");
    const dots = root.querySelectorAll<HTMLElement>("[data-dot]");
    if (calm || !line) return void showNow(g, [...items, line]);
    g.fromTo(
      line,
      { scaleY: 0 },
      { scaleY: 1, ease: "none", scrollTrigger: { trigger: root, start: "top 70%", end: "bottom 60%", scrub: 0.6 } },
    );
    items.forEach((el, i) => {
      const side = i % 2 === 0 ? -40 : 40;
      g.fromTo(
        el,
        { x: side, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } },
      );
      g.fromTo(
        dots[i],
        { scale: 0 },
        { scale: 1, duration: 0.7, ease: "back.out(3)", scrollTrigger: { trigger: el, start: "top 80%", once: true } },
      );
    });
  });

  return (
    <Section id="roadmap">
      <SectionHead
        eyebrow="Roadmap"
        title="What’s live,"
        quiet="and what’s next."
        lead="No guessing: each milestone says whether you can use it today. The order can change as we learn from early users."
      />
      <div ref={wrap} className="relative mx-auto mt-[clamp(32px,5vw,64px)] max-w-3xl">
        <i aria-hidden className="absolute top-2 bottom-2 left-[19px] w-px bg-line md:left-1/2" />
        <i data-line aria-hidden className="absolute top-2 bottom-2 left-[19px] w-0.5 origin-top bg-green-fg md:left-[calc(50%-0.5px)]" />
        <ol className="flex flex-col gap-6">
          {ROADMAP.map((m, i) => (
            <li key={m.t} className="relative grid grid-cols-[40px_1fr] items-start gap-4 md:grid-cols-2 md:gap-12">
              <span
                data-dot
                aria-hidden
                className="absolute top-5 left-[12px] z-10 size-[15px] rounded-full bg-green-fg shadow-[0_0_0_5px_var(--green-bg)] md:left-[calc(50%-7.5px)]"
              />
              <div
                data-step
                data-reveal
                className={`col-start-2 opacity-0 ${i % 2 === 0 ? "md:col-start-1 md:pr-2" : "md:col-start-2 md:pl-2"}`}
              >
                <Tip content={statusTip(m.status)} className="flex w-full">
                  <Glass
                    variant="flat"
                    radius="r3"
                    tone={m.status === "live" ? "mint" : m.status === "building" ? "amber" : "sand"}
                    glare
                    lift
                    className="flex w-full flex-col gap-2 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusChip status={m.status} />
                      <span className="text-[12.5px] text-fg-subtle">{m.when}</span>
                    </div>
                    <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-fg">{m.t}</h3>
                    <p className="text-[14.5px] leading-relaxed text-fg-muted">{m.d}</p>
                  </Glass>
                </Tip>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
