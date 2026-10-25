import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ReaderScreen } from "@/features/rss/ReaderScreen";
import { EmptyState } from "@/components/ui/States";
import { Segmented } from "@/components/ui/Segmented";
import { Palette, Space } from "@/constants/theme";

type View_ = "workspace" | "reader";
const VIEWS: { key: View_; label: string }[] = [
  { key: "workspace", label: "Workspace" },
  { key: "reader", label: "Reader" },
];

/** The Workspace tab: a switcher between the Workspace overview (coming soon) and the RSS Reader. The web has the same two pages. */
export function WorkspaceScreen() {
  const [view, setView] = useState<View_>("workspace");
  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <View style={styles.pills}>
        <Segmented options={VIEWS} value={view} onChange={setView} />
      </View>
      {view === "reader" ? (
        <ReaderScreen />
      ) : (
        <EmptyState icon="briefcase" title="Workspace: coming soon" hint="Shared spaces where your team keeps notes, tasks and chat together." />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.page },
  pills: { paddingHorizontal: Space.lg, paddingTop: Space.sm, paddingBottom: Space.md },
});
