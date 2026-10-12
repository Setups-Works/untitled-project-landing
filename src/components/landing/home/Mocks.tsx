import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowsRotate, faCheck, faMicrophone, faPaperclip, faTableColumns, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import type { ReactNode } from "react";

/** Small, static product illustrations used by the deep-dive sections. Sample content only — they are not the real app. */

const bar = "h-2 rounded-full bg-fg/10";

function Window({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-r3 bg-white/70 shadow-glass">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <i className="size-2.5 rounded-full bg-clay-fg/40" />
        <i className="size-2.5 rounded-full bg-amber-fg/40" />
        <i className="size-2.5 rounded-full bg-green-fg/40" />
        <span className="ml-2 text-[12.5px] text-fg-subtle">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function NoteMock() {
  return (
    <Window title="Notes · Product launch">
      <div className="text-[11.5px] font-semibold tracking-[0.1em] text-fg-faint uppercase">Note</div>
      <div className="mt-1 font-serif text-[30px] leading-tight tracking-[-0.02em]">Launch plan, v3</div>
      <div className="mt-4 flex flex-col gap-2.5">
        <div className={`${bar} w-full`} />
        <div className={`${bar} w-5/6`} />
        <div className={`${bar} w-2/3`} />
      </div>
      <div className="mt-5 rounded-r2 bg-surface-muted p-3 text-[13px] text-fg-muted">
        <span className="font-mono text-green-fg">/</span> heading, list, quote, to-do…
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ["at-blue", "Roadmap"],
          ["at-violet", "Ideas"],
          ["at-amber", "Pricing"],
        ].map(([c, l]) => (
          <span key={l} className={`${c} tint rounded-pill px-3 py-1 text-[12.5px]`}>
            {l}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-muted px-3 py-1 text-[12.5px] text-fg-muted">
          <FA icon={faMicrophone} className="text-[11px]" /> Dictate
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-muted px-3 py-1 text-[12.5px] text-fg-muted">
          <FA icon={faPaperclip} className="text-[11px]" /> 2 files
        </span>
      </div>
    </Window>
  );
}

export function TaskMock() {
  const rows: [string, string, boolean, string][] = [
    ["Draft announcement", "Urgent", true, "border-l-clay-fg"],
    ["Review pricing page", "High", false, "border-l-orange-fg"],
    ["Send recap to the team", "Medium", false, "border-l-blue-fg"],
  ];
  return (
    <Window title="Tasks · Today">
      <div className="flex items-center justify-between">
        <div className="font-serif text-[28px] tracking-[-0.02em]">Plan next to the work</div>
        <span className="liquid-pill inline-flex rounded-pill p-0.5 text-[12px]">
          {["List", "Board", "Calendar"].map((l, i) => (
            <span key={l} className={`rounded-pill px-2.5 py-1 ${i === 0 ? "bg-white text-fg shadow-e1" : "text-fg-muted"}`}>
              {l}
            </span>
          ))}
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {rows.map(([t, p, done, edge]) => (
          <div key={t} className={`flex items-center gap-3 rounded-r2 border-l-[3px] bg-white/80 px-3.5 py-3 shadow-e1 ${edge}`}>
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full ${done ? "bg-green-fg text-on-dark" : "shadow-[inset_0_0_0_1.5px_var(--line-strong)]"}`}
            >
              {done && <FA icon={faCheck} className="text-[9px]" />}
            </span>
            <span className={`flex-1 text-[14.5px] ${done ? "text-fg-subtle line-through" : "text-fg"}`}>{t}</span>
            <span className="text-[12px] text-fg-subtle">{p}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-[12.5px] text-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <FA icon={faArrowsRotate} className="text-green-fg" /> Every Monday
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FA icon={faTableColumns} className="text-violet-fg" /> Board view
        </span>
      </div>
    </Window>
  );
}

export function JournalMock() {
  return (
    <Window title="Journal · Private">
      <div className="text-[11.5px] font-semibold tracking-[0.1em] text-fg-faint uppercase">Today</div>
      <div className="mt-3 rounded-r3 bg-violet-bg/70 p-4 shadow-[inset_0_0_0_1px_var(--abl)] at-violet">
        <div className="text-[12px] text-violet-fg">7:42 am</div>
        <div className="mt-2 flex flex-col gap-2">
          <div className={`${bar} w-full`} />
          <div className={`${bar} w-11/12`} />
          <div className={`${bar} w-1/2`} />
        </div>
      </div>
      <div className="mt-3 rounded-r3 bg-white/80 p-4 shadow-e1">
        <div className="text-[12px] text-fg-subtle">6:15 pm</div>
        <div className="mt-2 flex items-center gap-2 text-[13px] text-fg-muted">
          <FA icon={faMicrophone} className="text-violet-fg" />
          <span className="flex h-5 flex-1 items-center gap-0.5" aria-hidden>
            {[30, 60, 40, 85, 50, 70, 35, 55, 80, 45, 65, 30, 50].map((h, i) => (
              <i key={i} className="w-1 rounded-full bg-violet-fg/40" style={{ height: `${h}%` }} />
            ))}
          </span>
          0:24
        </div>
      </div>
    </Window>
  );
}

export function CalendarMock() {
  const days = Array.from({ length: 35 }, (_, i) => i + 1);
  const ev: Record<number, [string, string]> = {
    9: ["at-green", "Planning"],
    12: ["at-blue", "1:1"],
    16: ["at-violet", "Gym"],
    18: ["at-amber", "Launch"],
    23: ["at-clay", "Lunch"],
  };
  const task = [11, 18, 25];
  return (
    <Window title="Calendar · Month">
      <div className="flex items-center justify-between">
        <div className="font-serif text-[28px] tracking-[-0.02em]">October 2026</div>
        <span className="liquid-pill rounded-pill px-3 py-1 text-[12px] text-fg-muted">Tasks on</span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-px overflow-hidden rounded-r2 bg-line text-[11.5px]">
        {days.map((d) => (
          <div key={d} className="min-h-[46px] bg-white/70 p-1">
            <span className={`text-fg-subtle ${d === 18 ? "inline-grid size-5 place-items-center rounded-full bg-fg text-on-dark" : ""}`}>
              {(d % 31) + 1}
            </span>
            {ev[d] && <span className={`${ev[d][0]} tint mt-0.5 block truncate rounded-[5px] px-1 text-[11px]`}>{ev[d][1]}</span>}
            {task.includes(d) && (
              <span className="mt-0.5 block truncate rounded-[5px] border-l-2 border-l-orange-fg bg-surface-sunken px-1 text-[11px] text-fg-muted">
                Task
              </span>
            )}
          </div>
        ))}
      </div>
    </Window>
  );
}

export function ChatMock() {
  return (
    <Window title="Chat · Launch notes">
      <div className="flex flex-col gap-3">
        <div className="ml-auto max-w-[80%] rounded-r3 rounded-br-r1 bg-fg px-4 py-2.5 text-[14px] text-on-dark">
          Turn that into a task for Friday.
        </div>
        <div className="max-w-[88%] rounded-r3 rounded-bl-r1 bg-white/85 px-4 py-3 text-[14px] text-fg shadow-e1">
          <span className="mb-2 flex items-center gap-2 text-[12px] text-violet-fg">
            <FA icon={faWandMagicSparkles} /> Draft task
          </span>
          Send the recap to the team
          <span className="mt-3 flex items-center gap-2 text-[12.5px] text-fg-subtle">Due Fri · Priority high</span>
          <span className="mt-3 flex gap-2">
            <span className="rounded-pill bg-surface-sunken px-3.5 py-1.5 text-[12.5px] text-fg-muted">Not now</span>
            <span className="rounded-pill bg-fg px-3.5 py-1.5 text-[12.5px] text-on-dark">Confirm and save</span>
          </span>
        </div>
        <p className="text-center text-[12px] text-fg-faint">Nothing is saved until you confirm.</p>
      </div>
    </Window>
  );
}
