import type { CalendarEvent, Task, Tone } from "@untitled/types";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useCalendarEvents } from "./queries";
import { useTasks } from "@/features/tasks/queries";
import { AppText } from "@/components/ui/AppText";
import { Card } from "@/components/ui/Card";
import { CalendarGrid } from "@/components/ui/DatePicker";
import { Icon } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Palette, Radius, Space, Tints } from "@/constants/theme";
import { errorMessage } from "@/lib/api";
import { dayLabel, isoDate, timeOf } from "@/lib/dates";

/** An event can span several days; this is how many we mark at most, so a runaway range can't freeze the grid. */
const MAX_SPAN_DAYS = 62;
const EDGES: ("left" | "right")[] = ["left", "right"];

const isTone = (c: string): c is Tone => c in Tints;
const toneOf = (c: string): Tone => (isTone(c) ? c : "blue");

/** Every local calendar day an event touches. An all-day event ends at midnight, which belongs to the next day. */
function daysOf(e: CalendarEvent) {
  const start = new Date(e.start_at);
  const end = new Date(e.end_at);
  const out: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getTime() - (e.all_day || end.getTime() > start.getTime() ? 1 : 0));
  while (cursor <= last && out.length < MAX_SPAN_DAYS) {
    out.push(isoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out.length ? out : [isoDate(start)];
}

/** Month view with a dot on days that have events or to-dos, and the selected day's agenda underneath. Read-only on the phone for now. */
export function CalendarPage() {
  const eventsQ = useCalendarEvents();
  const tasksQ = useTasks();
  const today = isoDate();
  const [date, setDate] = useState(today);

  const { byDay, tasksByDay } = useMemo(() => {
    const events = new Map<string, CalendarEvent[]>();
    for (const e of eventsQ.data ?? []) for (const d of daysOf(e)) events.set(d, [...(events.get(d) ?? []), e]);
    const tasks = new Map<string, Task[]>();
    for (const t of tasksQ.data ?? []) {
      if (!t.due_date || t.cancelled || t.archived) continue;
      tasks.set(t.due_date, [...(tasks.get(t.due_date) ?? []), t]);
    }
    return { byDay: events, tasksByDay: tasks };
  }, [eventsQ.data, tasksQ.data]);

  const marks = useMemo(() => new Set([...byDay.keys(), ...tasksByDay.keys()]), [byDay, tasksByDay]);
  const events = byDay.get(date) ?? [];
  const tasks = tasksByDay.get(date) ?? [];
  const refreshing = eventsQ.isRefetching || tasksQ.isRefetching;
  const refresh = () => void Promise.all([eventsQ.refetch(), tasksQ.refetch()]);

  return (
    <Screen edges={EDGES} onRefresh={refresh} refreshing={refreshing}>
      <View style={styles.head}>
        <AppText variant="display">Calendar</AppText>
        <AppText variant="small">Your events and the to-dos due each day</AppText>
      </View>

      {eventsQ.isPending ? (
        <LoadingState />
      ) : eventsQ.isError ? (
        <ErrorState message={errorMessage(eventsQ.error)} onRetry={() => void eventsQ.refetch()} />
      ) : (
        <>
          <Card tone="blue">
            <CalendarGrid value={date} onPick={setDate} marks={marks} />
          </Card>

          <AppText variant="label" style={styles.dayTitle}>
            {dayLabel(date, today)}
          </AppText>

          {events.length === 0 && tasks.length === 0 ? (
            <AppText variant="small" color={Palette.fgSubtle}>
              Nothing planned for this day.
            </AppText>
          ) : (
            <View style={styles.list}>
              {events.map((e) => {
                const tone = Tints[toneOf(e.color)];
                return (
                  <Card key={e.id} tone={toneOf(e.color)} accessibilityLabel={`Event: ${e.title}`}>
                    <View style={styles.row}>
                      <View style={[styles.bar, { backgroundColor: tone.fg }]} />
                      <View style={styles.flex}>
                        <AppText variant="bodyStrong" color={tone.fg}>
                          {e.title}
                        </AppText>
                        <AppText variant="small" color={tone.fg}>
                          {e.all_day ? "All day" : `${timeOf(e.start_at)} – ${timeOf(e.end_at)}`}
                          {e.location ? ` · ${e.location}` : ""}
                        </AppText>
                      </View>
                    </View>
                  </Card>
                );
              })}
              {tasks.map((t) => (
                <Card key={t.id} accessibilityLabel={`To-do: ${t.title}`}>
                  <View style={styles.row}>
                    <Icon name={t.done ? "circle-check" : "circle"} size={18} color={t.done ? Palette.greenFg : Palette.fgFaint} />
                    <AppText variant="body" style={[styles.flex, t.done ? styles.done : null]}>
                      {t.title}
                    </AppText>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { gap: Space.xs, marginBottom: Space.lg },
  dayTitle: { marginTop: Space.xl, marginBottom: Space.sm },
  list: { gap: Space.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Space.md },
  bar: { width: 4, alignSelf: "stretch", borderRadius: Radius.pill },
  done: { textDecorationLine: "line-through", color: Palette.fgSubtle },
});
