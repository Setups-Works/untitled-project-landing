import { FontAwesome6 } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Palette, Radius, Shadow } from "@/constants/theme";

/**
 * "Continue with Google". The glyph is drawn in ink, not Google's multicolour mark, which stays confined to the web app's
 * GoogleMark.tsx; swap in the official asset here if brand review requires it.
 */
export function GoogleButton({ onPress, busy, disabled }: { onPress: () => void; busy: boolean; disabled: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, Shadow.e1, { opacity: disabled ? 0.55 : pressed ? 0.85 : 1 }]}
    >
      {busy ? <ActivityIndicator color={Palette.fg} /> : <FontAwesome6 name="google" brand size={17} color={Palette.fg} />}
      <AppText variant="bodyStrong">{busy ? "Connecting to Google…" : "Continue with Google"}</AppText>
    </Pressable>
  );
}

export function OrDivider() {
  return (
    <View style={styles.or}>
      <View style={styles.rule} />
      <AppText variant="small" color={Palette.fgFaint}>
        or
      </AppText>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 50,
    borderRadius: Radius.pill,
    backgroundColor: Palette.glassHi,
    borderWidth: 1,
    borderColor: Palette.glassRing,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  or: { flexDirection: "row", alignItems: "center", gap: 12 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Palette.lineStrong },
});
