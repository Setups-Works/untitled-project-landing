"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faBookOpen,
  faCalendarDays,
  faCheck,
  faComments,
  faEye,
  faHandPointer,
  faKey,
  faListCheck,
  faLock,
  faPenToSquare,
  faPlug,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import Glass from "../Glass";
import { Eyebrow, Lead, Section, Title } from "../Kit";
import { showNow, useMotion } from "../motion";
import { R, Reveal } from "../Reveal";
import { Tip } from "../Tip";
import { toneClass, type Tone } from "../../../lib/tones";

const OPTS: { icon: typeof faPlug; t: string; d: string; node: string; flow: string; tone: Tone; off?: boolean }[] = [
  {
    icon: faPlug,
    t: "Use a supported AI account",
    d: "Connect an AI account you already have.",
    node: "Your AI account",
    flow: "Your own account does the thinking.",
    tone: "violet",
  },
  {
    icon: faKey,
    t: "Bring your own API key",
    d: "Choose your model provider and connect it directly.",
    node: "Your API key",
    flow: "You connect your provider directly.",
    tone: "blue",
  },
  {
    icon: faWallet,
    t: "Pay for usage when you need it",
    d: "Top up only when you need AI. No bundled AI subscription.",
    node: "Pay as you go",
    flow: "You pay only for what you use.",
    tone: "amber",
  },
  {
    icon: faBan,
    t: "Take a break from AI",
    d: "Keep your workspace fully AI-free.",
    node: "AI off",
    flow: "Nothing is sent to any model.",
    tone: "clay",
    off: true,
  },
];

const STEPS = [
  { icon: faComments, t: "You ask", d: "Say what you want in plain words." },
  { icon: faEye, t: "You preview", d: "The assistant shows exactly what it would create." },
  { icon: faHandPointer, t: "You decide", d: "Confirm to save it, or drop it. Nothing happens before that." },
] as const;

const CORE = [faPenToSquare, faListCheck, faBookOpen, faCalendarDays];

const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce";

/**
 * The swappable-AI idea as a diagram: the workspace never moves, whatever is plugged into the socket does. A packet travels down the
 * beam from the workspace to the socket; choosing "AI off" cuts the beam. It auto-cycles until you pick one.
 */
function Switcher() {
  const [on, setOn] = useState(0);
  const [hold, setHold] = useState(false);
  const socket = useRef<HTMLDivElement>(null);
  const flow = useRef<SVGPathElement>(null);
  const packet = useRef<HTMLSpanElement>(null);
  const opt = OPTS[on];

  useEffect(() => {
    if (hold || calm()) return;
    const t = setInterval(() => setOn((o) => (o + 1) % OPTS.length), 3600);
    return () => clearInterval(t);
  }, [hold]);

  useEffect(() => {
    if (!socket.current || calm()) return;
    gsap.fromTo(socket.current, { y: -20, scale: 0.92 }, { y: 0, scale: 1, duration: 0.9, ease: "elastic.out(1, 0.55)" });
  }, [on]);

  // The beam's dashes flow and a packet runs down it, unless AI is off.
  useEffect(() => {
    const path = flow.current;
    const dot = packet.current;
    if (!path || !dot || calm()) return;
    if (opt.off) {
      gsap.set(dot, { autoAlpha: 0 });
      return;
    }
    const dash = gsap.to(path, { strokeDashoffset: -24, duration: 0.9, ease: "none", repeat: -1 });
    gsap.set(dot, { autoAlpha: 1, y: 0 });
    const run = gsap.to(dot, { y: 68, duration: 1.1, ease: "power1.in", repeat: -1, repeatDelay: 0.35 });
    return () => {
      dash.kill();
      run.kill();
    };
  }, [opt]);

  return (
    <div className={`${toneClass(opt.tone)} flex flex-col`} onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)}>
      {/* The workspace: always the same, always lit. */}
      <div className="relative rounded-r4 bg-white/[0.07] p-5 text-center shadow-[inset_0_0_0_1px_var(--liquid-ghost),0_0_60px_-18px_var(--green-fg)]">
        <div className="flex justify-center gap-2.5">
          {CORE.map((icon, i) => (
            <span
              key={i}
              className="grid size-9 place-items-center rounded-r2 bg-white/10 text-[14px] shadow-[inset_0_0_0_1px_var(--liquid-ghost)]"
            >
              <FA icon={icon} />
            </span>
          ))}
        </div>
        <div className="mt-3 text-[11px] font-semibold tracking-[0.1em] text-on-dark/60 uppercase">Your workspace</div>
        <div className="mt-1 font-serif text-[21px] leading-tight tracking-[-0.02em]">Notes · Tasks · Journal · Calendar</div>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-[12.5px] text-on-dark/60">
          <FA icon={faLock} className="text-[10px]" /> Stays exactly where it is
        </div>
      </div>

      {/* The beam between workspace and socket. */}
      <div className="relative mx-auto h-[72px] w-2" aria-hidden>
        <svg
          viewBox="0 0 8 72"
          className={`h-full w-2 overflow-visible transition-colors duration-500 ${opt.off ? "text-on-dark/20" : "text-(--ab)"}`}
        >
          <path ref={flow} d="M4 0 V72" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 7" strokeLinecap="round" />
        </svg>
        <span
          ref={packet}
          className="absolute top-0 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-(--ab) shadow-[0_0_16px_3px_var(--ab)]"
        />
      </div>

      {/* The socket: whatever is plugged in right now. */}
      <div
        ref={socket}
        aria-live="polite"
        className={`mx-auto flex items-center gap-3 rounded-pill py-2.5 pr-6 pl-2.5 shadow-[inset_0_0_0_1px_var(--liquid-ghost)] transition-[background-color,box-shadow,opacity] duration-500 ${
          opt.off ? "bg-white/5 opacity-70" : "bg-(--ab)/20 shadow-[inset_0_0_0_1px_var(--liquid-ghost),0_0_50px_-8px_var(--ab)]"
        }`}
      >
        <span className="grid size-10 place-items-center rounded-full bg-white/90 text-[15px] text-(--abf)">
          <FA icon={opt.icon} />
        </span>
        <span className="text-[15.5px] font-medium">{opt.node}</span>
      </div>
      <p className="mx-auto mt-2.5 text-center text-[13px] text-on-dark/65">{opt.flow}</p>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="How AI is powered">
        {OPTS.map((o, i) => (
          <Tip key={o.t} content={o.d} className="flex">
            <button
              type="button"
              role="radio"
              aria-checked={on === i}
              onClick={() => setOn(i)}
              className={`${toneClass(o.tone)} flex w-full items-start gap-3 rounded-r3 p-3.5 text-left transition-[background-color,box-shadow,transform] duration-300 ease-site hover:-translate-y-0.5 ${
                on === i ? "bg-(--ab)/20 shadow-[inset_0_0_0_1px_var(--liquid-ghost)]" : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <span
                className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-[13px] transition-colors duration-300 ${on === i ? "bg-white/90 text-(--abf)" : "bg-white/15"}`}
              >
                <FA icon={o.icon} />
              </span>
              <b className="text-[14px] leading-snug font-medium">{o.t}</b>
            </button>
          </Tip>
        ))}
      </div>
    </div>
  );
}

/** "AI proposes. You decide." as a timeline whose line fills as you scroll and whose steps light up one by one. */
function Steps() {
  const ref = useRef<HTMLDivElement>(null);
  useMotion(ref, ({ g, root, calm: still }) => {
    const line = root.querySelector<HTMLElement>("[data-fill]");
    const dots = root.querySelectorAll<HTMLElement>("[data-dot]");
    if (still || !line) {
      dots.forEach((d) => (d.dataset.lit = "true"));
      return void showNow(g, [line]);
    }
    g.fromTo(
      line,
      { scaleX: 0 },
      { scaleX: 1, ease: "none", scrollTrigger: { trigger: root, start: "top 85%", end: "bottom 60%", scrub: 0.6 } },
    );
    // GSAP can't tween a var() colour, so each circle gets a pop and is lit through a data attribute (CSS transitions the colour).
    dots.forEach((d, i) => {
      g.fromTo(
        d,
        { scale: 0.6 },
        {
          scale: 1,
          duration: 0.5,
          ease: "back.out(3)",
          scrollTrigger: { trigger: root, start: `top ${80 - i * 8}%`, once: true, onEnter: () => (d.dataset.lit = "true") },
        },
      );
    });
  });
  return (
    <div ref={ref} className="relative">
      <div className="mb-6 text-center text-[11px] font-semibold tracking-[0.1em] text-on-dark/60 uppercase">AI proposes. You decide.</div>
      <div className="relative hidden md:block" aria-hidden>
        <i className="absolute top-[22px] right-[16.66%] left-[16.66%] h-px bg-white/15" />
        <i data-fill className="absolute top-[22px] right-[16.66%] left-[16.66%] h-px origin-left bg-(--green-bg)" />
      </div>
      <Reveal stagger={0.14} className="grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <R key={s.t} className="flex flex-col items-center gap-3 text-center">
            <span
              data-dot
              className="relative z-10 grid size-11 place-items-center rounded-full border border-white/25 bg-fill-dark text-[16px] transition-[background-color,border-color] duration-500 data-[lit=true]:border-transparent data-[lit=true]:bg-green-fg"
            >
              <FA icon={s.icon} />
              <i className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-white/90 font-mono text-[11px] text-fg not-italic">
                {i + 1}
              </i>
            </span>
            <div className="rounded-r3 bg-white/5 px-4 py-3 shadow-[inset_0_0_0_1px_var(--liquid-ghost)]">
              <b className="block text-[15.5px] font-medium">{s.t}</b>
              <small className="mt-1 block text-[13px] leading-snug text-on-dark/65">{s.d}</small>
            </div>
          </R>
        ))}
      </Reveal>
    </div>
  );
}

export default function AiSection() {
  return (
    <Section id="ai">
      <Reveal>
        {/* A solid deep-green layer under the smoked glass, so the panel is rich and opaque instead of grey. */}
        <div className="rounded-r5 bg-fill-dark">
          <Glass variant="dark" radius="r5" className="overflow-hidden p-[clamp(22px,4.5vw,64px)]">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-32 -right-24 -z-10 size-[520px] animate-drift-b rounded-full bg-(--orb-2)/45 blur-[110px] motion-reduce:animate-none"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-44 -left-28 -z-10 size-[520px] animate-drift-a rounded-full bg-(--orb-1)/55 blur-[110px] motion-reduce:animate-none"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/3 left-1/3 -z-10 size-[360px] animate-drift-c rounded-full bg-(--orb-4)/30 blur-[110px] motion-reduce:animate-none"
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
              <Steps />
            </div>
          </Glass>
        </div>
      </Reveal>
    </Section>
  );
}
