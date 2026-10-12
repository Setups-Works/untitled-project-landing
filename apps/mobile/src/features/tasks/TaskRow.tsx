import { dayLabel, recurrenceLabel } from "@untitled/logic";
import type { Task, TaskList } from "@untitled/types";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Icon } from "@/components/ui/Icon";
import { Palette, PriorityColor, Radius, Tints } from "@/constants/theme";

type Props = { task: Task; today: string; list?: TaskList | null; onToggle: (t: Task) => void; onOpen?: (t: Task) => void };

/** The checkbox ticks the task; the rest of the row opens it for editing. */
export function TaskRow({ task, today, list, onToggle, onOpen }: Props) {
  const overdue = !task.done && !!task.due_date && task.due_date < today;
  const tint = list ? Tints[list.color as keyof typeof Tints] : undefined;
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.done }}
        accessibilityLabel={`${task.title}, ${task.done ? "done" : "not done"}`}
        hitSlop={8}
        onPress={() => onToggle(task)}
        style={[styles.box, task.done ? styles.boxOn : { borderColor: PriorityColor[task.priority] ?? Palette.lineStrong }]}
      >
        {task.done ? <Icon name="check" size={12} color={Palette.onDark} /> : null}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${task.title}`} onPress={() => onOpen?.(task)} style={styles.body}>
        <AppText
          variant="body"
          color={task.done || task.cancelled ? Palette.fgFaint : Palette.fg}
          style={task.done || task.cancelled ? styles.struck : null}
          numberOfLines={2}
        >
          {task.title}
        </AppText>
        {task.due_date || task.recurrence || list ? (
          <View style={styles.meta}>
            {task.due_date ? (
              <AppText variant="small" color={overdue ? Palette.clayFg : Palette.fgSubtle}>
                {dayLabel(task.due_date, today)}
              </AppText>
            ) : null}
            {task.recurrence ? (
              <View style={styles.inline}>
                <Icon name="repeat" size={10} color={Palette.fgSubtle} />
                <AppText variant="small" color={Palette.fgSubtle}>
                  {recurrenceLabel(task.recurrence)}
                </AppText>
              </View>
            ) : null}
            {list ? (
              <View style={[styles.chip, { backgroundColor: tint?.bg ?? Palette.surfaceMuted }]}>
                <AppText variant="small" color={tint?.fg ?? Palette.fgMuted}>
                  {list.name}
                </AppText>
              </View>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 10, minHeight: 52 },
  box: { width: 24, height: 24, borderRadius: Radius.pill, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 1 },
  boxOn: { backgroundColor: Palette.greenFg, borderColor: Palette.greenFg },
  body: { flex: 1, gap: 2 },
  struck: { textDecorationLine: "line-through" },
  meta: { flexDirection: "row", gap: 10, alignItems: "center", flexWrap: "wrap" },
  inline: { flexDirection: "row", gap: 4, alignItems: "center" },
  chip: { paddingHorizontal: 8, paddingVertical: 1, borderRadius: Radius.pill },
});
