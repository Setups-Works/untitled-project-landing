import Link from "next/link";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import type { Task } from "../../../lib/workspace";
import type { CalendarEventItem } from "../types";
import { hhmm, timeLabel, toneOf } from "../utils";

/** A calendar event as a tinted chip. `at-<tone>` supplies the colours, `tint` paints them (same pairing as the Home cards). */
export function EventChip({
  ev,
  onOpen,
  showTime = true,
}: {
  ev: CalendarEventItem;
  onOpen: (ev: CalendarEventItem) => void;
  showTime?: boolean;
}) {
  const when = ev.all_day ? "All day" : timeLabel(hhmm(new Date(ev.start_at)));
  return (
    <button
      type="button"
      onClick={() => onOpen(ev)}
      title={`${ev.title} · ${when}`}
      className={`at-${toneOf(ev.color)} tint flex w-full min-w-0 items-center gap-1.5 rounded-[7px] px-2 py-[3px] text-left text-[12px] leading-snug transition-[filter] duration-150 hover:brightness-95 max-[900px]:px-1.5 max-[900px]:text-[11px]`}
    >
      {showTime && !ev.all_day && <span className="shrink-0 opacity-70">{timeLabel(hhmm(new Date(ev.start_at)), true)}</span>}
      <span className="truncate font-medium">{ev.title}</span>
    </button>
  );
}

// Same priority colours as the To-do calendar's chips.
const PRIORITY_EDGE: Record<number, string> = { 1: "border-l-clay-fg", 2: "border-l-[#c26a1a]", 3: "border-l-blue-fg" };

/** A task with a due date. It stays on the To-do side: the chip links there instead of editing the task here. */
export function TaskChip({ task }: { task: Task }) {
  return (
    <Link
      href="/dashboard/todo"
      title={`Task: ${task.title} (opens To-do)`}
      className={`flex w-full min-w-0 items-center gap-1.5 rounded-[7px] border-l-[3px] bg-surface-sunken px-2 py-[3px] text-[12px] leading-snug text-fg-muted transition-colors hover:text-fg max-[900px]:px-1.5 max-[900px]:text-[11px] ${PRIORITY_EDGE[task.priority] ?? "border-l-[#8f9084]"} ${task.done ? "opacity-60" : ""}`}
    >
      {task.done && <FA icon={faCheck} className="text-[9px] shrink-0" />}
      <span className={`truncate ${task.done ? "line-through" : ""}`}>{task.title}</span>
    </Link>
  );
}
