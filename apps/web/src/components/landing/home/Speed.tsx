"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Glass from "../Glass";
import { SHORTCUTS } from "../content";
import { Kbd, Lead, Section, Title, Eyebrow } from "../Kit";
import { Reveal } from "../Reveal";

const GROUPS = ["Anywhere", "Tasks", "Calendar"] as const;

/** Does this key press match a shortcut's key list? `⌘` means Cmd or Ctrl; `G T` is a two-step sequence. */
function matches(keys: string[], e: KeyboardEvent, lastKey: string) {
  const k = e.key.toLowerCase();
  if (keys[0] === "⌘") return (e.metaKey || e.ctrlKey) && k === keys[1].toLowerCase();
  if (e.metaKey || e.ctrlKey || e.altKey) return false;
  if (keys.length === 2) return lastKey === keys[0].toLowerCase() && k === keys[1].toLowerCase();
  return k === keys[0].toLowerCase();
}

/**
 * A shortcuts board you can play with: press the real keys while the section is on screen and the matching row lights up with a
 * little GSAP pop. The keys are only observed, never intercepted, so the browser's own shortcuts keep working.
 */
export default function Speed() {
  const board = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [hint, setHint] = useState("Press ⌘K, Q, W or C to try them.");

  useEffect(() => {
    const el = board.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    let last = "";
    let timer: ReturnType<typeof setTimeout>;
    const calm = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce";
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,select,[contenteditable=true]")) return;
      SHORTCUTS.forEach((s, i) => {
        if (!matches(s.keys, e, last)) return;
        const row = board.current?.querySelector<HTMLElement>(`[data-row="${i}"]`);
        if (!row) return;
        setHint(`${s.keys.join(" ")} — ${s.label}`);
        if (calm()) return;
        gsap.fromTo(
          row,
          { scale: 1.05, backgroundColor: "var(--green-bg)" },
          { scale: 1, backgroundColor: "transparent", duration: 0.9, ease: "elastic.out(1, 0.5)" },
        );
        gsap.fromTo(row.querySelectorAll("kbd"), { y: 6 }, { y: 0, duration: 0.6, stagger: 0.06, ease: "back.out(3)" });
      });
      last = e.key.toLowerCase();
      clearTimeout(timer);
      timer = setTimeout(() => (last = ""), 900);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, [active]);

  return (
    <Section>
      <div className="grid items-center gap-[clamp(28px,5vw,72px)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col items-start gap-5">
          <Reveal>
            <Eyebrow>Built for the keyboard</Eyebrow>
          </Reveal>
          <Title quiet="never leave the keys.">Move fast and</Title>
          <Reveal delay={150}>
            <Lead>
              Add a task, jump to today, search everything, switch the calendar view. All without reaching for the mouse. Shortcuts work
              whenever you aren’t typing in a field.
            </Lead>
          </Reveal>
          <Reveal delay={250}>
            <p
              aria-live="polite"
              className="liquid-pill inline-flex items-center gap-2.5 rounded-pill px-4 py-2 text-[13.5px] text-fg-muted"
            >
              <i className={`size-2 rounded-full ${active ? "animate-pulse bg-green-fg" : "bg-fg-faint"}`} aria-hidden />
              {hint}
            </p>
          </Reveal>
        </div>

        <div ref={board}>
          <Reveal>
            <Glass radius="r5" glare className="p-[clamp(18px,3vw,32px)]">
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {GROUPS.map((g) => (
                  <div key={g} className={g === "Anywhere" ? "sm:col-span-2" : ""}>
                    <div className="mb-2 text-[11px] font-semibold tracking-[0.1em] text-fg-faint uppercase">{g}</div>
                    <ul className={g === "Anywhere" ? "grid gap-x-8 sm:grid-cols-2" : ""}>
                      {SHORTCUTS.map((s, i) =>
                        s.group === g ? (
                          <li key={s.label} data-row={i} className="flex items-center justify-between gap-4 rounded-r2 px-2 py-2.5">
                            <span className="text-[14.5px] text-fg">{s.label}</span>
                            <span className="flex items-center gap-1.5">
                              {s.keys.map((k, n) => (
                                <span key={n} className="flex items-center gap-1.5">
                                  {n > 0 && g !== "Anywhere" && <small className="text-[12px] text-fg-faint">then</small>}
                                  <Kbd>{k}</Kbd>
                                </span>
                              ))}
                            </span>
                          </li>
                        ) : null,
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </Glass>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
