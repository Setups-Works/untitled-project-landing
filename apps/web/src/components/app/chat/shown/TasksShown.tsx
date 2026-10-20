"use client";
import { faListCheck } from "@fortawesome/free-solid-svg-icons";
import { dayLabel, TASK_SCOPE_LABEL, tasksInScope, type TaskScope } from "@untitled/logic";
import { useTasks } from "../../../../features/tasks/queries";
import { isoDate } from "../../../../lib/dates";
import ShownGroup, { ShownEmpty, ShownRow } from "./ShownGroup";

/** The person's open to-dos for a scope (today, overdue, upcoming, or all open), from the same cached list as the To-do page. */
export default function TasksShown({ scope }: { scope: TaskScope }) {
  const { tasks, isPending } = useTasks();
  const today = isoDate();
  const { items, total } = tasksInScope(tasks, scope, today);
  const more = total - items.length;
  return (
    <ShownGroup
      tone="amber"
      icon={faListCheck}
      title={TASK_SCOPE_LABEL[scope]}
      openLabel="Open to-dos"
      openHref="/dashboard/todo"
      note={more > 0 ? `${more} more in your to-do list` : undefined}
    >
      {isPending && <ShownEmpty>Loading…</ShownEmpty>}
      {!isPending && items.length === 0 && <ShownEmpty>Nothing here. You’re clear.</ShownEmpty>}
      {items.map((t) => (
        <ShownRow key={t.id} href={`/dashboard/todo?task=${encodeURIComponent(t.id)}`} label={`Open to-do: ${t.title}`}>
          <span className="line-clamp-2 text-[14.5px] font-medium">{t.title}</span>
          <span className="text-[12px] text-fg-subtle">{t.due_date ? dayLabel(t.due_date, today) : "No due date"}</span>
        </ShownRow>
      ))}
    </ShownGroup>
  );
}
