import type { ViewOpts } from "@untitled/logic";
import { DEFAULT_OPTS, PRIORITIES } from "@untitled/logic";
import { StyleSheet, Switch, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { PickerField } from "@/components/ui/PickerField";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { Palette } from "@/constants/theme";

const LAYOUTS = [
  { key: "list", label: "List" },
  { key: "board", label: "Board" },
  { key: "calendar", label: "Calendar" },
] as const;

/** Same options as the web's "View" panel: layout, sort, grouping, priority filter and completed tasks. */
export function ViewOptionsSheet({
  visible,
  opts,
  onChange,
  onClose,
  onArchiveCompleted,
  completedCount,
}: {
  visible: boolean;
  opts: ViewOpts;
  onChange: (p: Partial<ViewOpts>) => void;
  onClose: () => void;
  onArchiveCompleted: () => void;
  completedCount: number;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title="View">
      <View style={styles.gap}>
        <View style={styles.gap}>
          <AppText variant="label">Layout</AppText>
          <Segmented options={[...LAYOUTS]} value={opts.layout} onChange={(layout) => onChange({ layout })} />
        </View>
        <View style={styles.switch}>
          <AppText variant="body">Completed tasks</AppText>
          <Switch
            value={opts.showCompleted}
            onValueChange={(showCompleted) => onChange({ showCompleted })}
            trackColor={{ true: Palette.greenFg }}
            accessibilityLabel="Show completed tasks"
          />
        </View>
        <PickerField
          label="Sort by"
          value={opts.sortBy}
          options={[
            { value: "date", label: "Due date" },
            { value: "priority", label: "Priority" },
            { value: "name", label: "Name" },
            { value: "created", label: "Created" },
          ]}
          onChange={(sortBy) => onChange({ sortBy })}
        />
        <PickerField
          label="Order"
          value={opts.dir}
          options={[
            { value: "asc", label: "Ascending" },
            { value: "desc", label: "Descending" },
          ]}
          onChange={(dir) => onChange({ dir })}
        />
        <PickerField
          label="Group by"
          value={opts.groupBy}
          options={[
            { value: "none", label: "None" },
            { value: "date", label: "Date" },
            { value: "priority", label: "Priority" },
            { value: "list", label: "List" },
          ]}
          onChange={(groupBy) => onChange({ groupBy })}
        />
        <PickerField
          label="Priority"
          value={opts.priority}
          options={[{ value: 0, label: "All priorities" }, ...PRIORITIES.map((p) => ({ value: p.p as number, label: p.label }))]}
          onChange={(priority) => onChange({ priority: priority as ViewOpts["priority"] })}
        />
        <Button title="Reset view" kind="secondary" onPress={() => onChange({ ...DEFAULT_OPTS })} />
        {completedCount ? (
          <Button title={`Archive ${completedCount} completed`} kind="ghost" icon="box-archive" onPress={onArchiveCompleted} />
        ) : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 12, paddingBottom: 8 },
  switch: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 44 },
});
