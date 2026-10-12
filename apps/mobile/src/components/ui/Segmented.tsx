import { Pressable, ScrollView, StyleSheet } from "react-native";

import { AppText } from "./AppText";
import { Palette, Radius } from "@/constants/theme";

/** Row of pills used as a tab/filter switcher (the web's section switcher). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            style={[
              styles.pill,
              on
                ? { backgroundColor: Palette.fillDark }
                : { backgroundColor: Palette.glassHi, borderColor: Palette.glassRing, borderWidth: 1 },
            ]}
          >
            <AppText variant="small" color={on ? Palette.onDark : Palette.fgMuted} style={styles.text}>
              {o.label}
              {o.count ? `  ${o.count}` : ""}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 2 },
  pill: { minHeight: 38, paddingHorizontal: 16, borderRadius: Radius.pill, justifyContent: "center" },
  text: { fontWeight: "500" },
});
