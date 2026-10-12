import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { useJournal } from "@/features/journal/queries";
import { isOpen, isOverdue } from "@untitled/logic";
import { useTasks } from "@/features/tasks/queries";
import { TaskRow } from "@/features/tasks/TaskRow";
import { useToggleTask } from "@/features/tasks/useToggleTask";
import { AppText } from "@/components/ui/AppText";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Screen } from "@/components/ui/Screen";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Palette, Radius, Tints } from "@/constants/theme";
import { greeting, isoDate, longDate, timeOf } from "@/lib/dates";
import { errorMessage } from "@/lib/api";
import { useAppState } from "@/providers/AppState";

const QUICK: { href: "/todo" | "/notes" | "/journal"; label: string; icon: IconName; tone: "violet" | "amber" | "mint" }[] = [
  { href: "/todo", label: "Plan my day", icon: "list-check", tone: "violet" },
  { href: "/journal", label: "Write today’s journal", icon: "book-open", tone: "mint" },
  { href: "/notes", label: "Capture a note", icon: "pen-to-square", tone: "amber" },
];

/** Mobile Home: today's progress, what needs doing, today's journal, and shortcuts. Same data and rules as the web dashboard's Home. */
export function HomeScreen() {
  const { user } = useAppState();
  const tasksQ = useTasks();
  const journalQ = useJournal();
  const toggle = useToggleTask();
  const today = useMemo(() => isoDate(), []);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([tasksQ.refetch(), journalQ.refetch()]);
    setRefreshing(false);
  }, [tasksQ, journalQ]);

  const first = user?.name.split(" ")[0] ?? "";
  const header = (
    <View style={styles.headRow}>
      <View style={styles.head}>
        <AppText variant="label">{longDate()}</AppText>
        <AppText variant="title" accessibilityRole="header">
          {greeting()}
          {first ? `, ${first}` : ""}
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        hitSlop={8}
        onPress={() => router.push("/profile")}
        style={styles.avatar}
      >
        <AppText variant="bodyStrong" color={Palette.onDark}>
          {(user?.name || "?").trim().charAt(0).toUpperCase()}
        </AppText>
      </Pressable>
    </View>
  );

  if (tasksQ.isPending || journalQ.isPending)
    return (
      <Screen>
        {header}
        <LoadingState />
      </Screen>
    );

  if (tasksQ.isError || journalQ.isError)
    return (
      <Screen onRefresh={refresh} refreshing={refreshing}>
        {header}
        <ErrorState message={errorMessage(tasksQ.error ?? journalQ.error)} onRetry={() => void refresh()} />
      </Screen>
    );

  const tasks = tasksQ.data;
  const dueToday = tasks.filter((t) => t.due_date === today && !t.cancelled && !t.archived);
  const doneToday = dueToday.filter((t) => t.done).length;
  const pct = dueToday.length ? Math.round((doneToday / dueToday.length) * 100) : 0;
  const overdue = tasks.filter((t) => isOverdue(t, today));
  const next = tasks.filter((t) => isOpen(t) && !!t.due_date && t.due_date <= today).slice(0, 5);
  const entries = journalQ.data.filter((e) => e.entry_date === today).slice(0, 3);

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      {header}

      <Card tone="green" accessibilityLabel={`Today: ${doneToday} of ${dueToday.length} tasks done`}>
        <AppText variant="label" color={Palette.greenFg}>
          Today
        </AppText>
        <View style={styles.statRow}>
          <AppText variant="display">{dueToday.length ? `${doneToday}/${dueToday.length}` : "—"}</AppText>
          <AppText variant="small" style={styles.statCopy}>
            {dueToday.length ? "tasks done" : "Nothing due today"}
            {overdue.length ? ` · ${overdue.length} overdue` : ""}
          </AppText>
        </View>
        <View style={styles.track} accessibilityElementsHidden>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
      </Card>

      <View style={styles.sectionHead}>
        <AppText variant="label">Up next</AppText>
        <AppText variant="small" color={Palette.greenFg} accessibilityRole="link" onPress={() => router.navigate("/todo")}>
          See all
        </AppText>
      </View>
      {next.length ? (
        <Card tone="blue">
          {next.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              today={today}
              onToggle={toggle}
              onOpen={(x) => router.push({ pathname: "/task/[id]", params: { id: x.id } })}
            />
          ))}
        </Card>
      ) : (
        <Card tone="blue">
          <AppText variant="body" color={Palette.fgMuted}>
            {tasks.length ? "You’re all caught up for today." : "No tasks yet. Add your first in the To-do tab."}
          </AppText>
        </Card>
      )}

      <View style={styles.sectionHead}>
        <AppText variant="label">Today’s journal</AppText>
        <AppText variant="small" color={Palette.greenFg} accessibilityRole="link" onPress={() => router.navigate("/journal")}>
          Open
        </AppText>
      </View>
      {entries.length ? (
        entries.map((e) => (
          <Card
            key={e.id}
            tone="violet"
            onPress={() => router.push({ pathname: "/journal/[id]", params: { id: e.id } })}
            accessibilityLabel="Open journal entry"
          >
            <AppText variant="small" color={Palette.fgSubtle}>
              {timeOf(e.created_at)}
            </AppText>
            <AppText variant="body" numberOfLines={3}>
              {e.body || (e.attachments.length ? "" : "Empty entry")}
            </AppText>
            <AttachmentGallery attachments={e.attachments} />
          </Card>
        ))
      ) : (
        <Card tone="violet" onPress={() => router.navigate("/journal")} accessibilityLabel="Write today’s journal">
          <AppText variant="body" color={Palette.fgMuted}>
            Nothing written yet today. Tap to add an entry.
          </AppText>
        </Card>
      )}

      <AppText variant="label">Quick actions</AppText>
      <View style={styles.quick}>
        {QUICK.map((q) => {
          const t = Tints[q.tone];
          return (
            <Card key={q.href} tone={q.tone} onPress={() => router.navigate(q.href)} accessibilityLabel={q.label} style={styles.quickCard}>
              <View style={[styles.quickIcon, { backgroundColor: Palette.glassHi }]}>
                <Icon name={q.icon} size={16} color={t.fg} />
              </View>
              <AppText variant="bodyStrong">{q.label}</AppText>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  head: { gap: 6, marginBottom: 4, flexShrink: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Palette.fillDark,
    alignItems: "center",
    justifyContent: "center",
  },
  statRow: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginTop: 6 },
  statCopy: { marginBottom: 8, flexShrink: 1 },
  track: { height: 6, borderRadius: Radius.pill, backgroundColor: Palette.glassRing, marginTop: 12, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: Palette.greenFg, borderRadius: Radius.pill },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  quick: { gap: 10 },
  quickCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  quickIcon: { width: 36, height: 36, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center" },
});
