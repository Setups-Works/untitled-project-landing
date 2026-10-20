import { ROLE_LABEL, ROLE_TONE } from "@untitled/logic";
import type { SharedJournalRole } from "@untitled/types";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Radius, Tints } from "@/constants/theme";

/** The role a person has in a journal, as a small tinted pill. */
export function RolePill({ role }: { role: SharedJournalRole }) {
  const t = Tints[ROLE_TONE[role]];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg, borderColor: t.line }]}>
      <AppText variant="small" color={t.fg}>
        {ROLE_LABEL[role]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({ pill: { borderRadius: Radius.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 } });
