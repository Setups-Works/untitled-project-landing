import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HealthScreen } from "@/features/health/HealthScreen";
import { CalendarPage } from "@/features/calendar/CalendarPage";
import { NotesScreen } from "@/features/notes/NotesScreen";
import { TodoScreen } from "@/features/tasks/TodoScreen";
import { Segmented } from "@/components/ui/Segmented";
import { Palette, Space } from "@/constants/theme";

type View_ = "todo" | "notes" | "calendar" | "health";
const VIEWS: { key: View_; label: string }[] = [
  { key: "todo", label: "To-do" },
  { key: "notes", label: "Notes" },
  { key: "calendar", label: "Calendar" },
  { key: "health", label: "Health" },
];
const isView = (v: string | undefined): v is View_ => VIEWS.some((x) => x.key === v);
/** Pages sit side by side; the inner screens keep their own vertical scrolling. The stack header and tab bar own the other insets. */
const PAGE_EDGES: ("left" | "right")[] = ["left", "right"];

/**
 * To-do, Notes, Calendar and Health in one tab: pill switcher on top, and the pages can be dragged sideways. Other screens open a page with
 * `/todo?view=notes` or `/todo?view=calendar` or `/todo?view=health`.
 */
export function PlannerScreen() {
  const { view: viewParam } = useLocalSearchParams<{ view?: string }>();
  const { width } = useWindowDimensions();
  const pager = useRef<ScrollView>(null);
  const [view, setView] = useState<View_>(isView(viewParam) ? viewParam : "todo");
  const current = useRef(view);

  const go = useCallback(
    (next: View_, animated = true) => {
      current.current = next;
      setView(next);
      pager.current?.scrollTo({ x: VIEWS.findIndex((v) => v.key === next) * width, animated });
    },
    [width],
  );

  // Opening the tab with ?view=notes (from Home or chat) jumps to that page; a resize keeps the current page in view.
  useEffect(() => {
    go(isView(viewParam) ? viewParam : current.current, false);
  }, [viewParam, go]);

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    const next = VIEWS[Math.min(Math.max(index, 0), VIEWS.length - 1)]!.key;
    current.current = next;
    setView(next);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <View style={styles.pills}>
        <Segmented options={VIEWS} value={view} onChange={(v) => go(v)} />
      </View>
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={settle}
        style={styles.pager}
        accessibilityLabel="To-do, Notes, Calendar and Health"
      >
        <View style={{ width }}>
          <TodoScreen edges={PAGE_EDGES} />
        </View>
        <View style={{ width }}>
          <NotesScreen edges={PAGE_EDGES} />
        </View>
        <View style={{ width }}>
          <CalendarPage />
        </View>
        <View style={{ width }}>
          <HealthScreen edges={PAGE_EDGES} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.page },
  pills: { paddingHorizontal: Space.lg, paddingTop: Space.sm },
  pager: { flex: 1 },
});
