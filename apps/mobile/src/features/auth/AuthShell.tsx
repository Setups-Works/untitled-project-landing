import { Link } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { Palette } from "@/constants/theme";

/** Shared frame for login, signup and password reset: eyebrow, serif title with a quiet second line, then the form. */
export function AuthShell({
  eyebrow,
  title,
  quiet,
  sub,
  children,
}: {
  eyebrow: string;
  title: string;
  quiet: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.head}>
        <AppText variant="label" color={Palette.greenFg}>
          {eyebrow}
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          {title}{" "}
          <AppText variant="display" color={Palette.fgFaint}>
            {quiet}
          </AppText>
        </AppText>
        <AppText variant="body" color={Palette.fgMuted}>
          {sub}
        </AppText>
      </View>
      {children}
    </Screen>
  );
}

export function AuthLink({ lead, label, href }: { lead?: string; label: string; href: "/login" | "/signup" | "/forgot-password" }) {
  return (
    <View style={styles.link}>
      {lead ? <AppText variant="small">{lead}</AppText> : null}
      <Link href={href} replace accessibilityRole="link">
        <AppText variant="small" color={Palette.greenFg} style={styles.linkText}>
          {label}
        </AppText>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 28, gap: 20 },
  head: { gap: 10, marginBottom: 6 },
  link: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, minHeight: 36 },
  linkText: { fontWeight: "600" },
});
