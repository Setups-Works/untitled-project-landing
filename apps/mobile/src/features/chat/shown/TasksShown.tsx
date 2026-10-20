import { dayLabel, TASK_SCOPE_LABEL, tasksInScope, type TaskScope } from "@untitled/logic";
import { router } from "expo-router";

import { ShownEmpty, ShownGroup, ShownRow } from "./ShownGroup";
import { AppText } from "@/components/ui/AppText";
import { Palette } from "@/constants/theme";
import { useTasks } from "@/features/tasks/queries";
import { isoDate } from "@/lib/dates";

/** The person's open to-dos for a scope (today, overdue, upcoming, or all open), from the same cached list as the Plan tab. */
export function TasksShown({ scope }: { scope: TaskScope }) {
  const q = useTasks();
  const today = isoDate();
  const { items, total } = tasksInScope(q.data ?? [], scope, today);
  const more = total - items.length;
  return (
    <ShownGroup
      tone="amber"
      icon="list-check"
      title={TASK_SCOPE_LABEL[scope]}
      openLabel="Open to-dos"
      onOpen={() => router.navigate("/todo")}
      note={more > 0 ? `${more} more in your to-do list` : undefined}
    >
      {q.isPending ? <ShownEmpty>Loading…</ShownEmpty> : null}
      {q.data && items.length === 0 ? <ShownEmpty>Nothing here. You’re clear.</ShownEmpty> : null}
      {items.map((t) => (
        <ShownRow key={t.id} label={`Open to-do: ${t.title}`} onPress={() => router.push({ pathname: "/task/[id]", params: { id: t.id } })}>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {t.title}
          </AppText>
          <AppText variant="small" color={Palette.fgSubtle}>
            {t.due_date ? dayLabel(t.due_date, today) : "No due date"}
          </AppText>
        </ShownRow>
      ))}
    </ShownGroup>
  );
}
