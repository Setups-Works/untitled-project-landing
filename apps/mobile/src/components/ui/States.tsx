import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText } from "./AppText";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { Palette, Radius } from "@/constants/theme";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={Palette.greenFg} />
      <AppText variant="small">{label}</AppText>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <View style={[styles.badge, { backgroundColor: Palette.clayBg }]}>
        <Icon name="triangle-exclamation" size={18} color={Palette.clayFg} />
      </View>
      <AppText variant="heading" align="center">
        Couldn’t load this
      </AppText>
      <AppText variant="small" align="center">
        {message}
      </AppText>
      <Button title="Try again" kind="secondary" icon="rotate-right" onPress={onRetry} />
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: IconName;
  title: string;
  hint: string;
  action?: { title: string; onPress: () => void };
}) {
  return (
    <View style={styles.center}>
      <View style={[styles.badge, { backgroundColor: Palette.greenBg }]}>
        <Icon name={icon} size={18} color={Palette.greenFg} />
      </View>
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      <AppText variant="small" align="center">
        {hint}
      </AppText>
      {action ? <Button title={action.title} onPress={action.onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", gap: 12, paddingVertical: 40, paddingHorizontal: 12 },
  badge: { width: 48, height: 48, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center" },
});
