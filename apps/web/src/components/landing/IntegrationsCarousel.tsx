"use client";
import Glass from "./Glass";
import { GlassCarousel, type Slide } from "./GlassCarousel";
import { Logo } from "./Logo";
import { StatusChip } from "./Kit";
import { Tip } from "./Tip";
import { isLive } from "../../lib/logos";
import type { Tone } from "../../lib/tones";

type Group = { name: string; items: readonly { name: string; use: string }[] };

/** The tint of each group's card. A group not listed here gets `sand`. */
const TONES: Record<string, Tone> = {
  Communication: "blue",
  "Calendar & meetings": "green",
  Data: "amber",
  Work: "violet",
  More: "clay",
};

function GroupCard({ group }: { group: Group }) {
  const live = group.items.filter((it) => isLive(it.name)).length;
  return (
    <Glass
      variant="flat"
      radius="r4"
      tone={TONES[group.name] ?? "sand"}
      glare
      tilt
      className="flex h-full min-h-[360px] flex-col gap-5 p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-[clamp(24px,2.4vw,30px)] leading-tight tracking-[-0.02em] text-fg">{group.name}</h3>
        <span className="text-[12.5px] whitespace-nowrap text-fg-subtle">
          {live} of {group.items.length} live
        </span>
      </div>
      <div className="grid gap-2.5">
        {group.items.map((it) => {
          const on = isLive(it.name);
          return (
            <Tip
              key={it.name}
              className="flex w-full"
              content={on ? `${it.use}. Connect it from Settings.` : `${it.name} is planned. We’ll mark it live here when it ships.`}
            >
              <Glass
                variant="flat"
                radius="r3"
                glare
                tone={on ? "mint" : "sand"}
                className="flex w-full items-center gap-3.5 p-3"
                role="group"
                aria-label={it.name}
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-r2 bg-white/80 shadow-glass">
                  <Logo name={it.name} size={28} />
                </span>
                <span className="min-w-0">
                  <b className="block truncate text-[15px] font-semibold text-fg">{it.name}</b>
                  {on ? <span className="block text-[13px] text-fg-subtle">{it.use}</span> : <StatusChip status="soon" />}
                </span>
              </Glass>
            </Tip>
          );
        })}
      </div>
    </Glass>
  );
}

/**
 * Integrations as a carousel: one liquid-glass card per group, with each tool's logo and honest status. It reuses the same
 * `GlassCarousel` as the workspace section, so drag, arrows, dots and ← → behave the same. Hover a tool for what it will do.
 */
export function IntegrationsCarousel({ groups }: { groups: readonly Group[] }) {
  const slides: Slide[] = groups.map((g) => ({ key: g.name, label: g.name, node: <GroupCard group={g} /> }));
  return <GlassCarousel label="Integrations" slides={slides} />;
}
