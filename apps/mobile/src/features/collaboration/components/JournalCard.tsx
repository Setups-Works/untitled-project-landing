import { toneFor } from "@untitled/logic";
import type { SharedJournal } from "@untitled/types";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { RolePill } from "./RolePill";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Palette } from "@/constants/theme";

/** One shared journal in the list: its role, how many people and entries, and the two things you can do with it. */
export function JournalCard({ journal, onManage }: { journal: SharedJournal; onManage: () => void }) {
  const people = `${journal.member_count} ${journal.member_count === 1 ? "person" : "people"}`;
  const entries = `${journal.entry_count} ${journal.entry_count === 1 ? "entry" : "entries"}`;
  return (
    <Card tone={toneFor(journal.id)} style={styles.card}>
      <View style={styles.head}>
        <AppText variant="heading" style={styles.name}>
          {journal.name}
        </AppText>
        <RolePill role={journal.role} />
      </View>
      <View style={styles.meta}>
        <Icon name="user-group" size={13} color={Palette.fgSubtle} />
        <AppText variant="small">{people}</AppText>
        <Icon name="book-open" size={13} color={Palette.fgSubtle} />
        <AppText variant="small">{entries}</AppText>
      </View>
      <View style={styles.actions}>
        <Button
          title="Open"
          onPress={() => router.push({ pathname: "/journal/shared/[id]", params: { id: journal.id } })}
          style={styles.action}
        />
        <Button title={journal.role === "owner" ? "Manage" : "People"} kind="secondary" onPress={onManage} style={styles.action} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  head: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  name: { flex: 1 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  actions: { flexDirection: "row", gap: 10 },
  action: { flex: 1 },
});
