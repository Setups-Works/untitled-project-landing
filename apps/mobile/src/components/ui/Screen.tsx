import { RefreshControl, ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MaxContentWidth, Palette, Space } from "@/constants/theme";

type Props = {
  children: React.ReactNode;
  /** Scrolls the content; pass onRefresh to add pull-to-refresh. */
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  edges?: ("top" | "bottom" | "left" | "right")[];
  contentStyle?: StyleProp<ViewStyle>;
};

/** Cream canvas with safe areas, a readable max width on tablets, and keyboard avoidance. */
export function Screen({ children, scroll = true, onRefresh, refreshing = false, edges = ["top", "left", "right"], contentStyle }: Props) {
  const inner = <View style={[styles.column, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            refreshControl={
              onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.greenFg} /> : undefined
            }
          >
            {inner}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.scroll]}>{inner}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.page },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: "center" },
  column: {
    width: "100%",
    maxWidth: MaxContentWidth,
    paddingHorizontal: Space.xl - 4,
    paddingTop: Space.lg,
    paddingBottom: Space.xxl,
    gap: Space.lg,
  },
});
