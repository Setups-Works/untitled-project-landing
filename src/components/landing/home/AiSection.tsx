"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faBan, faCheck, faComments, faEye, faKey, faPlug, faWallet, faHandPointer } from "@fortawesome/free-solid-svg-icons";
import Glass from "../Glass";
import { Eyebrow, Lead, Section, Title } from "../Kit";
import { R, Reveal } from "../Reveal";

const OPTS = [
  { icon: faPlug, t: "Use a supported AI account", d: "Connect an AI account you already have.", node: "Your AI account" },
  { icon: faKey, t: "Bring your own API key", d: "Choose your model provider and connect it directly.", node: "Your API key" },
  {
    icon: faWallet,
    t: "Pay for usage when you need it",
    d: "Top up only when you need AI. No bundled AI subscription.",
    node: "Pay as you go",
  },
  { icon: faBan, t: "Take a break from AI", d: "Keep your workspace fully AI-free.", node: "AI off", off: true },
] as const;

const STEPS = [
  { icon: faComments, t: "You ask", d: "Say what you want in plain words." },
  { icon: faEye, t: "You preview", d: "The assistant shows exactly what it would create." },
  { icon: faHandPointer, t: "You decide", d: "Confirm to save it, or drop it. Nothing happens before that." },
] as const;

/** The swappable-AI idea made tangible: the workspace never moves, the thing plugged into it does. Auto-cycles; click to choose. */
function Switcher() {
  const [on, setOn] = useState(0);
  const [hold, setHold] = useState(false);
  const socket = useRef<HTMLDivElement>(null);
  const flow = useRef<SVGPathElement>(null);
  const opt = OPTS[on];
  const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce";

  useEffect(() => {
    if (hold || calm()) return;
    const t = setInterval(() => setOn((o) => (o + 1) % OPTS.length), 3400);
    return () => clearInterval(t);
  }, [hold]);

  useEffect(() => {
    if (!socket.current || calm()) return;
    gsap.fromTo(socket.current, { y: -18, scale: 0.94 }, { y: 0, scale: 1, duration: 0.9, ease: "elastic.out(1, 0.55)" });
  }, [on]);

  useEffect(() => {
    const path = flow.current;
    if (!path || calm()) return;
    const tween = gsap.to(path, { strokeDashoffset: -24, duration: 0.9, ease: "none", repeat: -1, paused: "off" in opt });
    return () => {
      tween.kill();
    };
  }, [opt]);

  return (
    <div className="flex flex-col items-stretch gap-0" onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)}>
      <div className="rounded-r3 bg-white/10 p-4 text-center shadow-[inset_0_0_0_1px_var(--liquid-ghost)]">
        <div className="text-[11px] font-semibold tracking-[0.1em] text-on-dark/60 uppercase">Your workspace</div>
        <div className="mt-1 font-serif text-[22px] leading-tight tracking-[-0.02em]">Notes · Tasks · Journal · Calendar</div>
        <div className="mt-1 text-[12.5px] text-on-dark/60">Stays exactly where it is</div>
      </div>
      <svg viewBox="0 0 4 44" className="mx-auto h-11 w-1" aria-hidden>
        <path
          ref={flow}
          d="M2 0 V44"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 6"
          className={"off" in opt ? "text-on-dark/25" : "text-on-dark/80"}
        />
      </svg>
      <div
        ref={socket}
        className={`mx-auto flex items-center gap-3 rounded-pill px-5 py-3 transition-[background-color,opacity] duration-500 ${"off" in opt ? "bg-white/5 opacity-60" : "bg-white/20"} shadow-[inset_0_0_0_1px_var(--liquid-ghost)]`}
        aria-live="polite"
      >
        <span className="grid size-8 place-items-center rounded-full bg-white/90 text-[13px] text-fg">
          <FA icon={opt.icon} />
        </span>
        <span className="text-[15px] font-medium">{opt.node}</span>
      </div>
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="How AI is powered">
        {OPTS.map((o, i) => (
          <button
            key={o.t}
            type="button"
            role="radio"
            aria-checked={on === i}
            onClick={() => setOn(i)}
            className={`flex items-start gap-3 rounded-r3 p-3.5 text-left transition-[background-color,box-shadow,transform] duration-300 ease-site hover:-translate-y-0.5 ${
              on === i ? "bg-white/20 shadow-[inset_0_0_0_1px_var(--liquid-ghost)]" : "bg-white/5 hover:bg-white/10"
            }`}
          >
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-white/15 text-[13px]">
              <FA icon={o.icon} />
            </span>
            <span>
              <b className="block text-[14px] leading-snug font-medium">{o.t}</b>
              <small className="mt-0.5 block text-[12.5px] leading-snug text-on-dark/60">{o.d}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AiSection() {
  return (
    <Section id="ai">
      <Reveal>
        <Glass variant="dark" radius="r5" className="overflow-hidden p-[clamp(22px,4.5vw,64px)]">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-24 -z-10 size-[460px] rounded-full bg-violet-fg/35 blur-[100px]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-40 -left-24 -z-10 size-[420px] rounded-full bg-green-fg/35 blur-[100px]"
          />
          <div className="grid items-center gap-[clamp(28px,5vw,64px)] lg:grid-cols-[1fr_1.05fr]">
            <div className="flex flex-col items-start gap-5">
              <Eyebrow dark>AI, on your terms</Eyebrow>
              <Title dark quiet="Your workspace shouldn’t.">
                Your AI can change.
              </Title>
              <Lead dark>
                Try a new model. Switch providers. Change what powers your AI. Your notes, tasks, journal and everything you’ve built stay
                exactly where they are.
              </Lead>
              <ul className="mt-1 grid gap-2.5 text-[15px] sm:grid-cols-2">
                {["Provider independence", "Bring your own API key", "Pay only when you use it", "AI-free mode, always available"].map(
                  (x) => (
                    <li key={x} className="flex items-center gap-2.5">
                      <span className="grid size-5 place-items-center rounded-full bg-white/15">
                        <FA icon={faCheck} className="text-[10px]" />
                      </span>
                      {x}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <Switcher />
          </div>

          <div className="mt-[clamp(32px,5vw,56px)] border-t border-white/10 pt-[clamp(24px,4vw,40px)]">
            <div className="mb-5 text-center text-[11px] font-semibold tracking-[0.1em] text-on-dark/60 uppercase">
              AI proposes. You decide.
            </div>
            <Reveal stagger={0.12} className="grid gap-3 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <R key={s.t} className="flex items-start gap-3.5 rounded-r3 bg-white/5 p-4 shadow-[inset_0_0_0_1px_var(--liquid-ghost)]">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15 text-[14px]">
                    <FA icon={s.icon} />
                  </span>
                  <span>
                    <b className="block text-[15px] font-medium">
                      <span className="mr-1.5 font-mono text-[12px] text-on-dark/50">{i + 1}</span>
                      {s.t}
                    </b>
                    <small className="mt-1 block text-[13px] leading-snug text-on-dark/65">{s.d}</small>
                  </span>
                </R>
              ))}
            </Reveal>
          </div>
        </Glass>
      </Reveal>
    </Section>
  );
}
