"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";
import { isLive } from "../../lib/logos";
import Glass from "./Glass";
import { Logo } from "./Logo";
import { StatusChip } from "./Kit";
import { Tip } from "./Tip";

type Group = { name: string; items: readonly { name: string; use: string }[] };

/** Integration groups as glass tabs. Each switch brings the tiles in with a short GSAP stagger; hover a tile for what it will do. */
export function IntegrationsTabs({ groups }: { groups: readonly Group[] }) {
  const [tab, setTab] = useState(groups[0].name);
  const grid = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce") return;
    const tiles = grid.current?.querySelectorAll("[data-tile]");
    if (tiles?.length)
      gsap.fromTo(
        tiles,
        { y: 22, autoAlpha: 0, scale: 0.96 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.6, stagger: 0.07, ease: "back.out(1.5)" },
      );
  }, [tab]);

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex flex-col items-center gap-8">
      <div className="max-w-full overflow-x-auto pb-1">
        <TabsList aria-label="Integration groups" className="liquid-pill mx-auto flex w-max rounded-pill p-1">
          {groups.map((g) => (
            <TabsTrigger
              key={g.name}
              value={g.name}
              className="h-10 rounded-pill px-4 text-[14px] whitespace-nowrap text-fg-muted transition-[background-color,color,box-shadow] duration-300 hover:text-fg data-[state=active]:bg-white data-[state=active]:text-fg data-[state=active]:shadow-e1"
            >
              {g.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div ref={grid} className="w-full">
        {groups.map((g) => (
          <TabsContent key={g.name} value={g.name} className="flex flex-wrap justify-center gap-3">
            {g.items.map((it) => {
              const live = isLive(it.name);
              return (
                <div key={it.name} data-tile className="w-full sm:w-[calc(50%-6px)] lg:w-[calc(25%-9px)]">
                  <Tip
                    className="flex w-full"
                    content={
                      live ? `${it.use}. Connect it from Settings.` : `${it.name} is planned. We’ll mark it live here when it ships.`
                    }
                  >
                    <Glass
                      variant="flat"
                      radius="r3"
                      glare
                      lift
                      tone={live ? "mint" : "sand"}
                      className="flex w-full items-center gap-4 p-4"
                      role="group"
                      aria-label={it.name}
                    >
                      <span className="grid size-14 shrink-0 place-items-center rounded-r2 bg-white/80 shadow-glass">
                        <Logo name={it.name} size={32} />
                      </span>
                      <span className="min-w-0">
                        <b className="block truncate text-[15.5px] font-semibold text-fg">{it.name}</b>
                        {live ? <span className="block text-[13px] text-fg-subtle">{it.use}</span> : <StatusChip status="soon" />}
                      </span>
                    </Glass>
                  </Tip>
                </div>
              );
            })}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
