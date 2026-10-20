import { initials, toneFor } from "@untitled/logic";
import type { JournalPerson } from "@untitled/types";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Radius, Tints } from "@/constants/theme";

const SIZE = { sm: 28, md: 38 } as const;

/** A round badge with a person's initials, in a colour that stays the same for that person everywhere (same rule as the web). */
export function PersonBadge({ person, size = "md" }: { person: JournalPerson; size?: keyof typeof SIZE }) {
  const t = Tints[toneFor(person.id)];
  const d = SIZE[size];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.badge, { width: d, height: d, backgroundColor: t.bg, borderColor: t.line }]}
    >
      <AppText variant={size === "sm" ? "label" : "bodyStrong"} color={t.fg}>
        {initials(person)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({ badge: { borderRadius: Radius.pill, borderWidth: 1, alignItems: "center", justifyContent: "center" } });
