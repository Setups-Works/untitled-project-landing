"use client";
import type { ReactNode } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import Glass from "../Glass";
import { CAPABILITIES, type Capability } from "../content";
import { GlassCarousel, type Slide } from "../GlassCarousel";
import { IconTile, Section, SectionHead, StatusChip, statusTip } from "../Kit";
import { Reveal } from "../Reveal";
import { Tip } from "../Tip";
import { CalendarLive, ChatLive, JournalLive, NoteLive, SearchLive, TaskLive } from "./BentoTiles";

const cap = (t: string) => CAPABILITIES.find((c) => c.t === t) as Capability;

/** One live slide: icon, honest status, title and blurb on top, the playable miniature underneath. */
function LiveCard({ name, children }: { name: string; children: ReactNode }) {
  const c = cap(name);
  return (
    <Glass variant="flat" radius="r4" tone={c.tone} glare tilt className="flex h-full min-h-[410px] flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <IconTile icon={c.icon} />
        <Tip content={statusTip(c.status)}>
          <span tabIndex={0} className="rounded-pill">
            <StatusChip status={c.status} />
          </span>
        </Tip>
      </div>
      <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.015em] text-fg">{c.t}</h3>
      <p className="mt-1.5 max-w-md text-[14.5px] leading-relaxed text-fg-muted">{c.d}</p>
      {children}
    </Glass>
  );
}

/** A feature that is planned, not built: a quiet dashed card, so it never reads like something you can use today. */
function SoonCard({ name }: { name: string }) {
  const c = cap(name);
  return (
    <div className="flex h-full min-h-[410px] flex-col rounded-r4 border border-dashed border-line-strong bg-white/30 p-6 transition-colors duration-300 hover:bg-white/55">
      <div className="flex items-start justify-between gap-3">
        <span className={`at-${c.tone} grid size-11 shrink-0 place-items-center rounded-r2 bg-(--abf)/10 text-[17px] text-(--abf)`}>
          <FA icon={c.icon} />
        </span>
        <Tip content={statusTip(c.status)}>
          <span tabIndex={0} className="rounded-pill">
            <StatusChip status={c.status} />
          </span>
        </Tip>
      </div>
      <h3 className="mt-5 text-[19px] font-semibold tracking-[-0.015em] text-fg">{c.t}</h3>
      <p className="mt-1.5 max-w-md text-[14.5px] leading-relaxed text-fg-muted">{c.d}</p>
      <p className="mt-auto pt-6 text-[13px] leading-relaxed text-fg-subtle">Still being built. We’ll mark it live here the day it ships.</p>
    </div>
  );
}

const live = (name: string, node: ReactNode, className?: string): Slide => ({
  key: name,
  label: name,
  className,
  node: <LiveCard name={name}>{node}</LiveCard>,
});
const soon = (name: string): Slide => ({
  key: name,
  label: `${name} (coming soon)`,
  className: "w-[min(80vw,340px)]",
  node: <SoonCard name={name} />,
});

/**
 * The workspace as a carousel of liquid-glass cards. Each live card plays a miniature of the real feature (a note's slash menu,
 * tasks you can tick, a recording, a calendar with a task overlay, ask → preview → confirm, a ⌘K search); the ones that are not built
 * yet come last, dashed and labelled. Swipe, drag, use the arrows or dots, or press ← → with the carousel focused.
 */
export default function Bento() {
  const slides: Slide[] = [
    live("Notes", <NoteLive />),
    live("Tasks", <TaskLive />),
    live("Journal", <JournalLive />),
    live("Calendar", <CalendarLive />, "w-[min(92vw,580px)]"),
    live("Chat with AI", <ChatLive />),
    live("Universal search", <SearchLive />),
    soon("Email"),
    soon("Meetings"),
    soon("Automations"),
  ];
  return (
    <Section id="workspace">
      <SectionHead
        eyebrow="The workspace"
        title="Everything in one place,"
        quiet="nothing in isolation."
        lead="Six tools you can use today, shown running. Swipe on to see what is still on the way, labelled so you always know where you stand."
      />
      <Reveal className="mt-[clamp(28px,4vw,52px)]">
        <GlassCarousel label="Workspace features" slides={slides} />
      </Reveal>
    </Section>
  );
}
