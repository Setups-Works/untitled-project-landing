import type { Note } from "@untitled/types";
import { ago, isOpen, isOverdue } from "@untitled/logic";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Screen } from "@/components/ui/Screen";
import { Font, Palette, Radius, Space, Tints } from "@/constants/theme";
import { errorMessage } from "@/lib/api";
import { addDays, greeting, isoDate, longDate, timeOf } from "@/lib/dates";
import { useJournal } from "@/features/journal/queries";
import { useNotes } from "@/features/notes/queries";
import { TaskRow } from "@/features/tasks/TaskRow";
import { useTasks } from "@/features/tasks/queries";
import { useToggleTask } from "@/features/tasks/useToggleTask";
import { useAppState, useAuth } from "@/providers/AppState";
import { PersonalityInsightsCard } from "./PersonalityInsightsCard";

/** Mobile overview of the journal streak, today's tasks, and recent notes. */
export function HomeScreen() {
  const { user } = useAppState();
  const auth = useAuth();
  const tasksQ = useTasks();
  const journalQ = useJournal();
  const notesQ = useNotes();
  const toggle = useToggleTask();
  const today = useMemo(() => isoDate(), []);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarCookie, setAvatarCookie] = useState<string | null>(null);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void auth.getCookie().then((cookie) => {
      if (active) setAvatarCookie(cookie);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [auth]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([tasksQ.refetch(), journalQ.refetch(), notesQ.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [tasksQ, journalQ, notesQ]);

  const first = user?.name.trim().split(/\s+/)[0] ?? "";
  const header = (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <AppText variant="heading" style={styles.greeting}>{greeting()},</AppText>
        <AppText variant="bodyStrong" accessibilityRole="header" style={styles.name}>
          {first ? first.toLocaleUpperCase() : "YOUR DAY"}
        </AppText>
        <AppText variant="small" color={Palette.fgSubtle}>{longDate()}</AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        hitSlop={8}
        onPress={() => router.push("/profile")}
        style={({ pressed }) => [styles.avatar, pressed ? styles.pressed : null]}
      >
        {user?.image && failedAvatar !== user.image ? (
          <Image
            source={{ uri: user.image, ...(avatarCookie ? { headers: { Cookie: avatarCookie } } : {}) }}
            style={styles.avatarImage}
            contentFit="cover"
            transition={150}
            onError={() => setFailedAvatar(user.image ?? null)}
            accessibilityLabel={`${user.name || "User"} profile photo`}
          />
        ) : (
          <AppText variant="bodyStrong" color={Palette.onDark}>
            {(user?.name || "?").trim().charAt(0).toUpperCase()}
          </AppText>
        )}
      </Pressable>
    </View>
  );

  if (tasksQ.isPending || journalQ.isPending || notesQ.isPending)
    return (
      <Screen>
        {header}
        <LoadingState />
      </Screen>
    );

  if (tasksQ.isError || journalQ.isError || notesQ.isError)
    return (
      <Screen onRefresh={refresh} refreshing={refreshing}>
        {header}
        <ErrorState message={errorMessage(tasksQ.error ?? journalQ.error ?? notesQ.error)} onRetry={() => void refresh()} />
      </Screen>
    );

  const tasks = tasksQ.data;
  const dueToday = tasks.filter((task) => task.due_date === today && !task.cancelled && !task.archived);
  const remaining = dueToday.filter((task) => !task.done).length;
  const todayTasks = dueToday.filter((task) => isOpen(task)).slice(0, 3);
  const overdue = tasks.filter((task) => isOverdue(task, today));
  const entries = journalQ.data;
  const loggedDays = new Set(entries.map((entry) => entry.entry_date));
  const todayLogged = loggedDays.has(today);
  const weekOffset = (new Date(`${today}T00:00:00`).getDay() + 6) % 7;
  const weekStart = addDays(today, -weekOffset);
  const week = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  let streak = 0;
  let streakDay = todayLogged ? today : addDays(today, -1);
  while (loggedDays.has(streakDay)) {
    streak++;
    streakDay = addDays(streakDay, -1);
  }
  const recentNotes = [...notesQ.data]
    .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())
    .slice(0, 3);

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      {header}

      <Card tone="green" liquidTint accessibilityLabel={`Journal streak: ${streak} days. ${todayLogged ? "Logged today" : "Not logged today"}`} style={styles.streakCard}>
        <View style={styles.cardHeader}>
          <AppText variant="bodyStrong">Journal streak</AppText>
          <AppText variant="label" color={todayLogged ? Palette.greenFg : Palette.fgSubtle}>
            {todayLogged ? "Today logged" : "Today not logged"}
          </AppText>
        </View>
        <View style={styles.streakSummary}>
          <View style={styles.streakNumber}>
            <AppText variant="display" style={styles.streakValue}>{streak}</AppText>
            <AppText variant="body" color={Palette.fgMuted}>days</AppText>
          </View>
          <AppText variant="small" color={Palette.fgMuted} align="right" style={styles.streakHint}>
            {streak ? `${Math.max(0, 7 - streak)} more for a full week.` : "Write an entry to start your streak."}
          </AppText>
        </View>
        <View style={styles.week} accessibilityLabel="Journal entries this week">
          {week.map((date) => {
            const active = loggedDays.has(date);
            const isToday = date === today;
            const label = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "narrow" });
            return (
              <View
                key={date}
                accessibilityLabel={`${new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long" })}${active ? ", journal entry saved" : ", no journal entry"}`}
                style={[styles.weekDay, active ? styles.weekDayActive : null, isToday && !active ? styles.weekDayToday : null]}
              >
                <AppText variant="small" color={active ? Palette.onDark : Palette.fgSubtle} style={styles.weekLabel}>{label}</AppText>
              </View>
            );
          })}
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <AppText variant="bodyStrong" style={styles.sectionTitle}>Today · {remaining} left</AppText>
        <SectionLink title="Open" onPress={() => router.navigate("/todo")} />
      </View>
      <Card tone="blue" liquidTint style={styles.taskCard}>
        {todayTasks.length ? todayTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            today={today}
            onToggle={toggle}
            onOpen={(item) => router.push({ pathname: "/task/[id]", params: { id: item.id } })}
          />
        )) : (
          <AppText variant="small" color={Palette.fgSubtle}>
            {overdue.length ? `${overdue.length} overdue. Open To-do to review your tasks.` : "No tasks for today. Open To-do to plan ahead."}
          </AppText>
        )}
      </Card>

      <View style={styles.sectionHeader}>
        <View style={styles.notesHeading}>
          <AppText variant="bodyStrong" style={styles.sectionTitle}>Notes</AppText>
          <AppText variant="label">{notesQ.data.length} saved</AppText>
        </View>
        <SectionLink title="Open" onPress={() => router.navigate("/notes")} />
      </View>
      <Card tone="amber" liquidTint style={styles.notesCard}>
        {recentNotes.length ? recentNotes.map((note, index) => (
          <View key={note.id}>
            {index > 0 ? <View style={styles.separator} /> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open note: ${noteTitle(note)}`}
              onPress={() => router.push({ pathname: "/note/[id]", params: { id: note.id } })}
              style={({ pressed }) => [styles.noteRow, pressed ? styles.pressed : null]}
            >
              <View style={styles.noteBullet} />
              <AppText variant="bodyStrong" numberOfLines={2} style={styles.noteTitle}>{noteTitle(note)}</AppText>
              <AppText variant="small" color={Palette.fgSubtle} style={styles.noteAge}>{ago(note.updated_at)}</AppText>
            </Pressable>
          </View>
        )) : (
          <AppText variant="small" color={Palette.fgSubtle}>No notes yet. Save an idea from Notes.</AppText>
        )}
      </Card>

      <View style={styles.sectionHeader}>
        <AppText variant="bodyStrong" style={styles.sectionTitle}>Today’s journal</AppText>
        <SectionLink title="Open" onPress={() => router.navigate("/journal")} />
      </View>
      {entries.filter((entry) => entry.entry_date === today).slice(0, 1).map((entry) => (
        <Card
          key={entry.id}
          tone="violet"
          liquidTint
          onPress={() => router.push({ pathname: "/journal/[id]", params: { id: entry.id } })}
          accessibilityLabel="Open today’s journal entry"
        >
          <AppText variant="small" color={Palette.fgSubtle}>{timeOf(entry.created_at)}</AppText>
          <AppText variant="body" numberOfLines={3}>{entry.body || "Voice or attachment"}</AppText>
          <AttachmentGallery attachments={entry.attachments} />
        </Card>
      ))}
      {!todayLogged ? (
        <Card tone="violet" liquidTint onPress={() => router.navigate("/journal")} accessibilityLabel="Write today’s journal">
          <AppText variant="small" color={Palette.fgSubtle}>Write your first entry for today.</AppText>
        </Card>
      ) : null}

      <PersonalityInsightsCard />
    </Screen>
  );
}

function SectionLink({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={styles.sectionLink}>
      <AppText variant="label" color={Palette.greenFg}>{title}</AppText>
      <Icon name="arrow-up-right-from-square" size={13} color={Palette.greenFg} />
    </Pressable>
  );
}

function noteTitle(note: Note) {
  return note.title.trim() || note.body.split("\n").find((line) => line.trim())?.replace(/^[#>*\-\s]+/, "").slice(0, 80) || "Untitled";
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Space.md, paddingTop: Space.xs },
  headerText: { flex: 1, gap: Space.xs },
  greeting: { ...Font.serifItalic, fontSize: 25, lineHeight: 29 },
  name: { fontSize: 30, lineHeight: 34, letterSpacing: -0.7, textTransform: "uppercase" },
  avatar: { width: 42, height: 42, borderRadius: Radius.pill, backgroundColor: Palette.fillDark, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: "100%", height: "100%", borderRadius: Radius.pill },
  pressed: { opacity: 0.72 },
  streakCard: { gap: Space.md, padding: Space.lg },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Space.sm },
  streakSummary: { minHeight: 78, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Space.md },
  streakNumber: { flexDirection: "row", alignItems: "baseline", gap: Space.sm },
  streakValue: { fontSize: 58, lineHeight: 62 },
  streakHint: { maxWidth: "54%" },
  week: { flexDirection: "row", gap: Space.sm },
  weekDay: { flex: 1, height: 36, alignItems: "center", justifyContent: "center", borderRadius: Radius.r1, backgroundColor: Palette.glassHi },
  weekDayActive: { backgroundColor: Palette.greenFg },
  weekDayToday: { borderWidth: 1, borderColor: Palette.greenFg },
  weekLabel: { textTransform: "uppercase" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: Space.md },
  sectionTitle: { fontSize: 18, lineHeight: 24 },
  sectionLink: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: Space.xs, paddingHorizontal: Space.xs },
  taskCard: { paddingHorizontal: Space.lg, paddingVertical: Space.sm, gap: 0 },
  notesHeading: { flexDirection: "row", alignItems: "baseline", gap: Space.md },
  notesCard: { paddingHorizontal: Space.lg, paddingVertical: Space.sm },
  noteRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: Space.md },
  noteBullet: { width: 8, height: 8, borderRadius: Radius.pill, backgroundColor: Tints.amber.fg },
  noteTitle: { flex: 1 },
  noteAge: { flexShrink: 0 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Palette.line, marginLeft: 20 },
});
