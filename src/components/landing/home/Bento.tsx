"use client";
import { useRef } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import Glass from "../Glass";
import { CAPABILITIES } from "../content";
import { IconTile, Section, SectionHead, StatusChip, statusTip } from "../Kit";
import { showNow, useMotion } from "../motion";
import { Tip } from "../Tip";

/** A few lines of fake UI per capability, so each tile shows what it is without a screenshot. */
function Mini({ t }: { t: string }) {
  const bar = "h-2 rounded-full bg-(--abf)/15";
  switch (t) {
    case "Notes":
      return (
        <div className="mt-auto flex flex-col gap-2 pt-5">
          <div className={`${bar} w-3/4`} />
          <div className={`${bar} w-full`} />
          <div className={`${bar} w-5/6`} />
        </div>
      );
    case "Tasks":
      return (
        <div className="mt-auto flex flex-col gap-2 pt-5">
          {[true, false, false].map((done, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span
                className={`grid size-4 place-items-center rounded-full ${done ? "bg-(--abf) text-white" : "shadow-[inset_0_0_0_1.5px_var(--abl)]"}`}
              >
                {done && <FA icon={faCheck} className="text-[8px]" />}
              </span>
              <span className={`${bar} ${i === 0 ? "w-2/5 opacity-60" : i === 1 ? "w-3/5" : "w-1/2"}`} />
            </div>
          ))}
        </div>
      );
    case "Journal":
      return (
        <div className="mt-auto pt-5">
          <div className="text-[11.5px] font-semibold tracking-[0.1em] text-(--abf)/70 uppercase">Today</div>
          <div className={`${bar} mt-2 w-full`} />
          <div className={`${bar} mt-2 w-2/3`} />
        </div>
      );
    case "Calendar":
      return (
        <div className="mt-auto grid grid-cols-7 gap-1 pt-5" aria-hidden>
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} className={`h-4 rounded-[5px] ${[2, 5, 9, 11].includes(i) ? "bg-(--abf)/35" : "bg-(--abf)/10"}`} />
          ))}
        </div>
      );
    case "Chat with AI":
      return (
        <div className="mt-auto flex flex-col gap-2 pt-5">
          <div className="ml-auto h-5 w-1/2 rounded-pill bg-(--abf)/20" />
          <div className="h-8 w-4/5 rounded-r2 bg-white/70 shadow-glass" />
        </div>
      );
    case "Universal search":
      return (
        <div className="mt-auto flex items-center justify-between rounded-pill bg-white/70 px-3.5 py-2 text-[12.5px] text-fg-subtle shadow-glass">
          <span>Search everything…</span>
          <kbd className="font-mono text-[11.5px] text-fg-muted">⌘K</kbd>
        </div>
      );
    case "Meetings":
      return (
        <div className="mt-auto flex h-8 items-end gap-1 pt-5" aria-hidden>
          {[40, 75, 55, 90, 45, 70, 30, 60, 85, 50].map((h, i) => (
            <i key={i} className="w-1.5 rounded-full bg-(--abf)/30" style={{ height: `${h}%` }} />
          ))}
        </div>
      );
    case "Automations":
      return (
        <div className="mt-auto flex flex-col gap-2 pt-5">
          {[true, false].map((on, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className={`${bar} w-1/2`} />
              <span className={`h-5 w-9 rounded-pill p-0.5 ${on ? "bg-(--abf)/50" : "bg-(--abf)/15"}`}>
                <i className={`block size-4 rounded-full bg-white shadow-e1 ${on ? "translate-x-4" : ""}`} />
              </span>
            </div>
          ))}
        </div>
      );
    default:
      return (
        <div className="mt-auto flex flex-col gap-2 pt-5">
          <div className={`${bar} w-full`} />
          <div className={`${bar} w-4/5`} />
          <div className={`${bar} w-1/2`} />
        </div>
      );
  }
}

// How far each tile starts from its place when the section scrolls in (px and degrees). Fixed so it's the same on every visit.
const SCATTER = [
  [-90, -60, -6],
  [0, -90, 4],
  [90, -50, 7],
  [-100, 40, 5],
  [10, 70, -4],
  [110, 30, -7],
  [-70, 90, 6],
  [60, 100, -5],
  [100, 80, 4],
];

/**
 * The workspace as a bento grid of glass tiles. Each tile states its honest status. As the section scrolls into view the tiles
 * fly in from scattered positions and settle into the grid, scrubbed by the scroll.
 */
export default function Bento() {
  const grid = useRef<HTMLDivElement>(null);
  useMotion(grid, ({ g, root, calm }) => {
    const tiles = root.querySelectorAll<HTMLElement>("[data-tile]");
    if (calm) return void showNow(g, tiles);
    tiles.forEach((el, i) => {
      const [x, y, r] = SCATTER[i % SCATTER.length];
      g.fromTo(
        el,
        { x, y, rotation: r, autoAlpha: 0, scale: 0.92 },
        {
          x: 0,
          y: 0,
          rotation: 0,
          autoAlpha: 1,
          scale: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: root, start: "top 88%", end: "top 38%", scrub: 0.9 },
        },
      );
    });
  });

  return (
    <Section id="workspace">
      <SectionHead
        eyebrow="The workspace"
        title="Everything in one place,"
        quiet="nothing in isolation."
        lead="What you can use today is marked live. What is still on the way says so, so you always know where you stand."
      />
      <div ref={grid} className="mt-[clamp(28px,4vw,52px)] grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((c, i) => (
          <div key={c.t} data-tile data-reveal className={`opacity-0 ${[0, 3, 8].includes(i) ? "lg:col-span-2" : ""}`}>
            <Glass variant="flat" radius="r4" tone={c.tone} glare tilt lift className="flex h-full min-h-[230px] flex-col p-6">
              <div className="flex items-start justify-between gap-3">
                <IconTile icon={c.icon} />
                <Tip content={statusTip(c.status)}>
                  <span tabIndex={0} className="rounded-pill">
                    <StatusChip status={c.status} />
                  </span>
                </Tip>
              </div>
              <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.015em] text-fg">{c.t}</h3>
              <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-fg-muted">{c.d}</p>
              <Mini t={c.t} />
            </Glass>
          </div>
        ))}
      </div>
    </Section>
  );
}
