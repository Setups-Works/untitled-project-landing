import Constants from "expo-constants";
import { router } from "expo-router";
import { Alert, Linking, Pressable, StyleSheet, View } from "react-native";
import { useState } from "react";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Palette, Radius } from "@/constants/theme";
import { mobileEnv } from "@/config/env";
import { useAppState } from "@/providers/AppState";

export function ProfileScreen() {
  const { user, signOut } = useAppState();
  const [busy, setBusy] = useState(false);
  const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();

  function confirmSignOut() {
    Alert.alert("Log out?", "You’ll need to sign in again to see your workspace.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          setBusy(true);
          // The route guards move to the sign-in screen as soon as the session is cleared.
          void signOut().finally(() => setBusy(false));
        },
      },
    ]);
  }

  return (
    <Screen>
      <View style={styles.head}>
        <AppText variant="title" accessibilityRole="header">
          Profile
        </AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={() => router.back()}>
          <AppText variant="bodyStrong" color={Palette.fgMuted}>
            Close
          </AppText>
        </Pressable>
      </View>
      <Card tone="green" style={styles.who}>
        <View style={styles.avatar}>
          <AppText variant="heading" color={Palette.onDark}>
            {initial}
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="heading" numberOfLines={1}>
            {user?.name}
          </AppText>
          <AppText variant="small" numberOfLines={1}>
            {user?.email}
          </AppText>
          {user?.username ? (
            <AppText variant="small" color={Palette.fgSubtle}>
              @{user.username}
            </AppText>
          ) : null}
        </View>
      </Card>

      <Card tone="blue" style={styles.list}>
        <Row label="Server" value={mobileEnv.apiBaseUrl ?? "—"} />
        <Row label="App version" value={Constants.expoConfig?.version ?? "—"} />
      </Card>

      {mobileEnv.privacyUrl ? (
        <Button
          title="Privacy & security"
          kind="secondary"
          icon="shield-halved"
          onPress={() => void Linking.openURL(mobileEnv.privacyUrl ?? "")}
        />
      ) : null}
      <Button title="Log out" kind="danger" icon="right-from-bracket" loading={busy} onPress={confirmSignOut} />
      <AppText variant="small" align="center" color={Palette.fgFaint}>
        Account settings, calendar and chat are on the web for now.
      </AppText>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="small">{label}</AppText>
      <AppText variant="small" color={Palette.fg} numberOfLines={1} style={styles.value}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  who: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Palette.fillDark,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1 },
  list: { gap: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  value: { flexShrink: 1, textAlign: "right" },
});
