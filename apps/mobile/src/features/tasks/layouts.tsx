import { addDays, applyOpts, groupTasks, isOpen, upcomingDates, type Group, type ViewOpts } from "@untitled/logic";
import type { Task, TaskList } from "@untitled/types";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { TaskRow } from "./TaskRow";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CalendarGrid } from "@/components/ui/DatePicker";
import { Palette } from "@/constants/theme";

type Ctx = { today: string; lists: TaskList[]; onToggle: (t: Task) => void; onOpen: (t: Task) => void };

const toneOf = (g: Group) =>
  g.tone && ["violet", "blue", "green", "amber", "clay", "sand", "mint", "gold"].includes(g.tone) ? (g.tone as "violet") : "sand";

function GroupCard({ group, ctx, showList }: { group: Group; ctx: Ctx; showList: boolean }) {
  return (
    <Card tone={group.title ? toneOf(group) : null} style={styles.group}>
      {group.title ? (
        <View style={styles.head}>
          <AppText variant="label" color={Palette.fgMuted}>
            {group.title}
          </AppText>
          <AppText variant="small">{group.tasks.length}</AppText>
        </View>
      ) : null}
      {group.tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          today={ctx.today}
          list={showList ? ctx.lists.find((l) => l.id === t.list_id) : null}
          onToggle={ctx.onToggle}
          onOpen={ctx.onOpen}
        />
      ))}
    </Card>
  );
}

export function ListLayout({ tasks, opts, ctx }: { tasks: Task[]; opts: ViewOpts; ctx: Ctx }) {
  const groups = useMemo(() => groupTasks(applyOpts(tasks, opts), opts.groupBy, ctx.lists, ctx.today), [tasks, opts, ctx.lists, ctx.today]);
  return (
    <View style={styles.stack}>
      {groups.map((g) => (
        <GroupCard key={g.key} group={g} ctx={ctx} showList={opts.groupBy !== "list"} />
      ))}
    </View>
  );
}

/** Columns like the web board: Overdue / Today / Upcoming / No date (or the chosen grouping), scrolled sideways. */
export function BoardLayout({ tasks, opts, ctx }: { tasks: Task[]; opts: ViewOpts; ctx: Ctx }) {
  const { today, lists } = ctx;
  const cols: Group[] = useMemo(() => {
    const sorted = applyOpts(tasks, opts);
    if (opts.groupBy !== "none") return groupTasks(sorted, opts.groupBy, lists, today);
    return [
      { key: "late", title: "Overdue", tone: "clay", tasks: sorted.filter((t) => isOpen(t) && t.due_date && t.due_date < today) },
      { key: "today", title: "Today", tone: "amber", tasks: sorted.filter((t) => isOpen(t) && t.due_date === today) },
      { key: "later", title: "Upcoming", tone: "mint", tasks: sorted.filter((t) => isOpen(t) && t.due_date && t.due_date > today) },
      { key: "none", title: "No date", tone: "sand", tasks: sorted.filter((t) => isOpen(t) && !t.due_date) },
      ...(opts.showCompleted ? [{ key: "done", title: "Completed", tone: "green", tasks: sorted.filter((t) => t.done) }] : []),
    ];
  }, [tasks, opts, lists, today]);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board} nestedScrollEnabled>
      {cols.map((c) => (
        <View key={c.key} style={styles.col}>
          <GroupCard group={{ ...c, title: c.title || "Tasks" }} ctx={ctx} showList={opts.groupBy !== "list"} />
        </View>
      ))}
    </ScrollView>
  );
}

/** A month grid with a dot on every day that has tasks (repeating tasks included), and the chosen day's tasks below. */
export function CalendarLayout({
  tasks,
  opts,
  ctx,
  onAddOn,
}: {
  tasks: Task[];
  opts: ViewOpts;
  ctx: Ctx;
  onAddOn: (date: string) => void;
}) {
  const [day, setDay] = useState(ctx.today);
  const by = useMemo(() => {
    const m = new Map<string, Task[]>();
    const add = (iso: string, t: Task) => m.set(iso, [...(m.get(iso) ?? []), t]);
    const horizon = addDays(ctx.today, 400);
    applyOpts(tasks, opts).forEach((t) => {
      if (!t.due_date) return;
      add(t.due_date, t);
      // Open repeating tasks also appear on every later day they come back on; they open the real task.
      if (t.recurrence && isOpen(t))
        for (const iso of upcomingDates(t.due_date, t.recurrence, horizon)) add(iso, { ...t, due_date: iso, id: t.id });
    });
    return m;
  }, [tasks, opts, ctx.today]);
  const marks = useMemo(() => new Set(by.keys()), [by]);
  const dayTasks = by.get(day) ?? [];
  return (
    <View style={styles.stack}>
      <Card tone="violet">
        <CalendarGrid value={day} onPick={setDay} marks={marks} />
      </Card>
      <Card style={styles.group}>
        <View style={styles.head}>
          <AppText variant="label">{day === ctx.today ? "Today" : day}</AppText>
          <AppText variant="small">{dayTasks.length}</AppText>
        </View>
        {dayTasks.length ? (
          dayTasks.map((t, i) => (
            <TaskRow
              key={`${t.id}-${i}`}
              task={t}
              today={ctx.today}
              list={ctx.lists.find((l) => l.id === t.list_id)}
              onToggle={ctx.onToggle}
              onOpen={ctx.onOpen}
            />
          ))
        ) : (
          <AppText variant="small">No tasks on this day.</AppText>
        )}
        <Button title="Add a task on this day" kind="secondary" icon="plus" onPress={() => onAddOn(day)} style={styles.add} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  group: { gap: 2 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  board: { gap: 12, paddingRight: 8 },
  col: { width: 290 },
  add: { marginTop: 8 },
});
