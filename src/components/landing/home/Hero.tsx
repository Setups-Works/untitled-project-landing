"use client";
import { useRef } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck, faFeatherPointed, faMagnifyingGlass, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import AuthLink from "../../auth/AuthLink";
import HeroApp from "../../HeroApp";
import Glass from "../Glass";
import { Eyebrow, Kbd, Lead, WRAP } from "../Kit";
import { Magnetic } from "../Magnetic";
import { showNow, useMotion } from "../motion";
import { Parallax } from "../Parallax";
import { Reveal } from "../Reveal";
import { Title } from "../Title";
import { Tip } from "../Tip";

const chip =
  "liquid-pill flex items-center gap-2.5 rounded-pill py-2.5 pr-4 pl-3 text-[13.5px] text-fg whitespace-nowrap animate-float motion-reduce:animate-none";

/**
 * The hero. The headline words rise out of a mask, the device settles from a tilted 3D pose, and four glass notifications pop in
 * around it, drifting at different depths as you scroll. The device then leans back a little as it leaves the screen.
 */
export default function Hero() {
  const stage = useRef<HTMLDivElement>(null);
  useMotion(stage, ({ g, root, calm }) => {
    const device = root.querySelector<HTMLElement>("[data-device]");
    const scrub = root.querySelector<HTMLElement>("[data-scrub]");
    const chips = root.querySelectorAll<HTMLElement>("[data-chip]");
    if (calm || !device || !scrub) return void showNow(g, [device, ...chips]);
    g.fromTo(
      device,
      { rotationX: 18, y: 90, scale: 0.9, autoAlpha: 0, transformPerspective: 1400, transformOrigin: "50% 0%" },
      { rotationX: 0, y: 0, scale: 1, autoAlpha: 1, duration: 1.5, ease: "power3.out", delay: 1 },
    );
    g.fromTo(
      chips,
      { scale: 0.5, autoAlpha: 0, y: 24 },
      { scale: 1, autoAlpha: 1, y: 0, duration: 1, ease: "back.out(1.9)", stagger: 0.16, delay: 1.7 },
    );
    g.to(scrub, {
      rotationX: -5,
      scale: 0.96,
      y: -36,
      transformPerspective: 1400,
      ease: "none",
      scrollTrigger: { trigger: scrub, start: "top 15%", end: "bottom top", scrub: true },
    });
  });

  return (
    <section className="relative overflow-hidden pt-[clamp(48px,8vw,112px)] pb-[clamp(24px,4vw,56px)]">
      <div className={`${WRAP} flex flex-col items-center text-center`}>
        <Reveal>
          <Eyebrow icon={faWandMagicSparkles}>Your AI can change. Your workspace shouldn’t.</Eyebrow>
        </Reveal>
        <Title as="h1" size="display" onLoad className="mt-6 max-w-[940px]" quiet="think, plan and send.">
          One workspace for everything you
        </Title>
        <Reveal delay={700} className="mt-6">
          <Lead className="mx-auto">
            Notes, tasks, journal, calendar and chat — together in one place, with email, meetings and automations on the way. Use AI when
            it helps. Ignore it when it doesn’t.
          </Lead>
        </Reveal>
        <Reveal delay={900} className="mt-9">
          <div id="start" className="flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <AuthLink arrow />
            </Magnetic>
            <a className="btn btn-secondary" href="#workspace" data-cursor="Scroll">
              See what’s inside
            </a>
          </div>
        </Reveal>
      </div>

      <div ref={stage} className={`${WRAP} relative mt-[clamp(40px,6vw,72px)]`}>
        <div data-scrub>
          <div data-device data-reveal className="opacity-0">
            <Glass radius="r5" glare className="p-2 sm:p-3">
              <div className="overflow-hidden rounded-r4">
                <HeroApp />
              </div>
            </Glass>
          </div>
        </div>

        {/* Glass notifications around the device. Three nested layers so scroll depth, entrance and idle float never fight over one transform. */}
        <Parallax speed={-70} className="pointer-events-none absolute top-[18%] -left-3 z-10 hidden lg:block xl:-left-28">
          <div data-chip data-reveal className="pointer-events-auto opacity-0">
            <Tip content="Press ⌘K (or Ctrl K) anywhere in the app to search your tasks, notes, journal and chats.">
              <div className={chip}>
                <FA icon={faMagnifyingGlass} className="text-green-fg" />
                Search everything <Kbd>⌘K</Kbd>
              </div>
            </Tip>
          </div>
        </Parallax>
        <Parallax speed={90} className="pointer-events-none absolute top-[10%] -right-3 z-10 hidden lg:block xl:-right-24">
          <div data-chip data-reveal className="pointer-events-auto opacity-0">
            <Tip content="Tick a task off in one place and it updates everywhere it appears.">
              <div className={`${chip} [animation-delay:-3s]`}>
                <span className="grid size-6 place-items-center rounded-full bg-green-fg text-[11px] text-on-dark">
                  <FA icon={faCheck} />
                </span>
                Draft announcement · done
              </div>
            </Tip>
          </div>
        </Parallax>
        <Parallax speed={-110} className="pointer-events-none absolute bottom-[22%] -left-3 z-10 hidden lg:block xl:-left-32">
          <div data-chip data-reveal className="pointer-events-auto opacity-0">
            <Tip content="When the assistant drafts a note, journal entry or to-do, you see a preview and confirm before anything is saved.">
              <div className={`${chip} [animation-delay:-5s]`}>
                <FA icon={faWandMagicSparkles} className="text-violet-fg" />
                AI draft · waiting for your OK
              </div>
            </Tip>
          </div>
        </Parallax>
        <Parallax speed={70} className="pointer-events-none absolute right-0 bottom-[14%] z-10 hidden lg:block xl:-right-20">
          <div data-chip data-reveal className="pointer-events-auto opacity-0">
            <Tip content="Your journal is private to you, with many entries a day, voice and attachments.">
              <div className={`${chip} [animation-delay:-1.5s]`}>
                <FA icon={faFeatherPointed} className="text-amber-fg" />
                Journal entry saved
              </div>
            </Tip>
          </div>
        </Parallax>
      </div>
    </section>
  );
}
