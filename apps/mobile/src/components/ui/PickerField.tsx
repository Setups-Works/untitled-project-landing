import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "./AppText";
import { Icon } from "./Icon";
import { Sheet } from "./Sheet";
import { Palette, Radius } from "@/constants/theme";

export type Option<T extends string | number> = { value: T; label: string };

/** A labelled pill that opens a sheet of choices (the mobile form of the web's `tf-pill` select). */
export function PickerField<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label ?? "—";
  return (
    <View style={styles.wrap}>
      <AppText variant="small" style={styles.label}>
        {label}
      </AppText>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${current}`} onPress={() => setOpen(true)} style={styles.box}>
        <AppText variant="body" style={styles.value} numberOfLines={1}>
          {current}
        </AppText>
        <Icon name="chevron-down" size={12} color={Palette.fgSubtle} />
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={[styles.row, on ? { backgroundColor: Palette.greenBg } : null]}
            >
              <AppText variant="body" style={styles.value}>
                {o.label}
              </AppText>
              {on ? <Icon name="check" size={14} color={Palette.greenFg} /> : null}
            </Pressable>
          );
        })}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginLeft: 4 },
  box: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    borderRadius: Radius.r2,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.glassHi,
    paddingHorizontal: 16,
    gap: 8,
  },
  value: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", minHeight: 50, paddingHorizontal: 14, borderRadius: Radius.r2 },
});
