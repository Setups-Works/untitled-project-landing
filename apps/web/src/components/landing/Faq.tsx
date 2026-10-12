"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Glass from "./Glass";
import { R, Reveal } from "./Reveal";
import { TONES } from "../../lib/tones";

const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce";

/** Questions and answers as glass rows. The answer opens with a GSAP height tween; only one is open at a time. */
export function FaqList({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(0);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const first = useRef(true);
  const previous = useRef<number | null>(0);

  useEffect(() => {
    // The first render already shows the right state; only animate changes after that.
    if (first.current) {
      first.current = false;
      return;
    }
    const d = calm() ? 0 : 0.55;
    const was = previous.current;
    if (was !== null && was !== open) gsap.to(panels.current[was], { height: 0, duration: d, ease: "power3.inOut" });
    if (open !== null) gsap.fromTo(panels.current[open], { height: 0 }, { height: "auto", duration: d, ease: "power3.inOut" });
    previous.current = open;
  }, [open]);

  return (
    <Reveal stagger={0.07} className="flex flex-col gap-3">
      {items.map(([q, a], n) => {
        const on = open === n;
        return (
          <R key={q}>
            <Glass variant="flat" radius="r3" tone={TONES[n % TONES.length]} glare className="overflow-hidden">
              <h3>
                <button
                  type="button"
                  aria-expanded={on}
                  aria-controls={`faq-${n}`}
                  id={`faq-b-${n}`}
                  onClick={() => setOpen(on ? null : n)}
                  data-cursor={on ? "Close" : "Open"}
                  className="flex w-full items-center gap-4 px-5 py-[18px] text-left sm:px-6"
                >
                  <span className="font-mono text-[12.5px] text-(--abf) tabular-nums">{String(n + 1).padStart(2, "0")}</span>
                  <span className="flex-1 text-[16.5px] font-medium tracking-[-0.01em] text-fg">{q}</span>
                  <span aria-hidden className="relative size-7 shrink-0 rounded-full bg-white/70 shadow-glass">
                    <i className="absolute top-1/2 left-1/2 h-px w-3 -translate-x-1/2 bg-fg" />
                    <i
                      className={`absolute top-1/2 left-1/2 h-px w-3 -translate-x-1/2 bg-fg transition-transform duration-500 ease-site ${on ? "rotate-0" : "rotate-90"}`}
                    />
                  </span>
                </button>
              </h3>
              <div
                ref={(el) => {
                  panels.current[n] = el;
                }}
                id={`faq-${n}`}
                role="region"
                aria-labelledby={`faq-b-${n}`}
                inert={!on}
                style={{ height: on ? "auto" : 0 }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-5 pl-[60px] text-[15.5px] leading-relaxed text-fg-muted sm:px-6 sm:pb-6 sm:pl-[68px]">{a}</p>
              </div>
            </Glass>
          </R>
        );
      })}
    </Reveal>
  );
}
