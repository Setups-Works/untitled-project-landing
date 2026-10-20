import { ROLE_HELP, ROLE_LABEL, personName } from "@untitled/logic";
import type { SharedJournalInvite } from "@untitled/types";
import { StyleSheet, View } from "react-native";

import { PersonBadge } from "./PersonBadge";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/** An invitation to join someone's journal, with the two answers. */
export function InviteCard({
  invite,
  busy,
  onAnswer,
}: {
  invite: SharedJournalInvite;
  busy: boolean;
  onAnswer: (action: "accept" | "decline") => void;
}) {
  return (
    <Card tone="amber" style={styles.card}>
      <View style={styles.head}>
        <PersonBadge person={invite.inviter} />
        <View style={styles.text}>
          <AppText variant="body">
            <AppText variant="bodyStrong">{personName(invite.inviter)}</AppText> invited you to{" "}
            <AppText variant="bodyStrong">{invite.journal_name}</AppText>
          </AppText>
          <AppText variant="small">
            As {ROLE_LABEL[invite.role].toLowerCase()}. {ROLE_HELP[invite.role]}
          </AppText>
        </View>
      </View>
      <View style={styles.actions}>
        <Button title="Decline" kind="secondary" disabled={busy} onPress={() => onAnswer("decline")} style={styles.action} />
        <Button title="Accept" loading={busy} onPress={() => onAnswer("accept")} style={styles.action} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  head: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  text: { flex: 1, gap: 2 },
  actions: { flexDirection: "row", gap: 10 },
  action: { flex: 1 },
});
