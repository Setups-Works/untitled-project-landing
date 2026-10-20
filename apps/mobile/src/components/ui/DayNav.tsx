import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "./AppText";
import { Icon, type IconName } from "./Icon";
import { Palette, Radius, Space } from "@/constants/theme";

/**
 * The day picker shared by Journal and Health: a round glass arrow either side of a glass pill that shows the date and opens the
 * calendar. `hint` is a small line under the date (for example how many figures were recorded).
 */
export function DayNav({
  label,
  hint,
  accessibilityLabel,
  onPrev,
  onNext,
  onOpen,
  prevDisabled = false,
  nextDisabled = false,
}: {
  label: string;
  hint?: string;
  accessibilityLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onOpen: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Round icon="chevron-left" label="Previous day" disabled={prevDisabled} onPress={onPrev} />
      <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onOpen} style={styles.pill}>
        <Icon name="calendar-days" size={15} color={Palette.fgMuted} />
        <View style={styles.text}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {label}
          </AppText>
          {hint ? (
            <AppText variant="small" color={Palette.fgSubtle} numberOfLines={1}>
              {hint}
            </AppText>
          ) : null}
        </View>
      </Pressable>
      <Round icon="chevron-right" label="Next day" disabled={nextDisabled} onPress={onNext} />
    </View>
  );
}

/** A round glass button, like the web's `ne-btn`. */
function Round({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.round, disabled ? styles.disabled : null]}
    >
      <Icon name={icon} size={16} color={Palette.fgMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: Space.sm },
  round: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.glassHi,
    borderWidth: 1,
    borderColor: Palette.glassRing,
  },
  pill: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Space.sm,
    paddingHorizontal: Space.lg,
    paddingVertical: Space.xs,
    borderRadius: Radius.pill,
    backgroundColor: Palette.glassHi,
    borderWidth: 1,
    borderColor: Palette.glassRing,
  },
  text: { alignItems: "center" },
  disabled: { opacity: 0.35 },
});
