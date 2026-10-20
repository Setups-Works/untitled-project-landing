import { SHARED_JOURNAL as LIMIT, personName } from "@untitled/logic";
import type { SharedJournalInviteRole, SharedJournalMember } from "@untitled/types";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { useCollaborationActions, useSharedJournal } from "../queries";
import { PersonBadge } from "./PersonBadge";
import { RolePicker } from "./RolePicker";
import { RolePill } from "./RolePill";
import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/Confirm";
import { PromptSheet } from "@/components/ui/PromptSheet";
import { Sheet } from "@/components/ui/Sheet";
import { LoadingState } from "@/components/ui/States";
import { TextField } from "@/components/ui/TextField";
import { Palette } from "@/constants/theme";
import { errorMessage } from "@/lib/api";

const handle = (p: { username: string | null }) => (p.username ? `@${p.username}` : "No username");

/**
 * Everything about one journal's people in a sheet: who is in it, roles, invitations, rename, and leaving or deleting.
 * The owner sees all of it; members see the list and a Leave button. The server decides what each role may do.
 */
export function ManageSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const q = useSharedJournal(id ?? "");
  const act = useCollaborationActions();
  const { ask, dialog } = useConfirm();
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<SharedJournalInviteRole>("editor");
  const [renaming, setRenaming] = useState(false);
  const journal = id ? q.data : undefined;
  const owner = journal?.role === "owner";
  const people = journal ? journal.members.length + journal.invites.length : 0;
  const full = people >= LIMIT.maxPeople;

  const fail = (e: unknown) => setErr(errorMessage(e));
  const close = () => {
    setErr("");
    setNote("");
    setUsername("");
    onClose();
  };

  async function invite() {
    if (!id || !username.trim()) return;
    setErr("");
    setNote("");
    try {
      await act.invite.mutateAsync({ id, username, role });
      setNote(`Invitation sent to @${username.trim().replace(/^@/, "")}. They join when they accept.`);
      setUsername("");
    } catch (e) {
      fail(e);
    }
  }

  async function remove(m: SharedJournalMember) {
    if (!id) return;
    const yes = await ask({
      title: `Remove ${personName(m.person)}?`,
      body: "They’ll lose access to this journal. Their entries stay.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (yes) act.removeMember.mutate({ id, userId: m.person.id }, { onError: fail });
  }

  async function leaveOrDelete() {
    if (!id || !journal) return;
    const yes = await ask(
      owner
        ? {
            title: "Delete this journal?",
            body: `“${journal.name}” and every entry in it will be permanently deleted for everyone.`,
            confirmLabel: "Delete journal",
            danger: true,
          }
        : {
            title: "Leave this journal?",
            body: `You’ll no longer see “${journal.name}”. The owner can invite you again.`,
            confirmLabel: "Leave journal",
            danger: true,
          },
    );
    if (!yes) return;
    const done = { onSuccess: close, onError: fail };
    if (owner) act.remove.mutate(id, done);
    else act.removeMember.mutate({ id, userId: journal.me }, done);
  }

  return (
    <>
      <Sheet visible={id !== null} onClose={close} title={journal?.name ?? "Journal"}>
        {q.isError ? <Banner kind="error">Couldn’t load this journal. It may have been deleted, or you’re no longer in it.</Banner> : null}
        {!journal && !q.isError ? <LoadingState /> : null}
        {journal ? (
          <View style={styles.stack}>
            <AppText variant="label">PEOPLE · {journal.members.length}</AppText>
            {journal.members.map((m) => (
              <View key={m.person.id} style={styles.person}>
                <View style={styles.row}>
                  <PersonBadge person={m.person} />
                  <View style={styles.text}>
                    <AppText variant="bodyStrong">
                      {personName(m.person)}
                      {m.person.id === journal.me ? " (you)" : ""}
                    </AppText>
                    <AppText variant="small">{handle(m.person)}</AppText>
                  </View>
                  <RolePill role={m.role} />
                </View>
                {owner && m.role !== "owner" ? (
                  <View style={styles.manage}>
                    <RolePicker
                      value={m.role}
                      onChange={(next) => act.setRole.mutate({ id: id!, userId: m.person.id, role: next }, { onError: fail })}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${personName(m.person)}`}
                      hitSlop={10}
                      onPress={() => void remove(m)}
                    >
                      <AppText variant="bodyStrong" color={Palette.clayFg}>
                        Remove
                      </AppText>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}

            {owner ? (
              <>
                <AppText variant="label">INVITE SOMEONE</AppText>
                <TextField
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username"
                  maxLength={LIMIT.usernameMax + 1}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!full}
                />
                <RolePicker value={role} onChange={setRole} />
                <Button
                  title="Send invitation"
                  icon="paper-plane"
                  loading={act.invite.isPending}
                  disabled={full || !username.trim()}
                  onPress={() => void invite()}
                />
                {note ? <Banner kind="success">{note}</Banner> : null}
                {full ? <AppText variant="small">A journal holds up to {LIMIT.maxPeople} people.</AppText> : null}
                {journal.invites.map((i) => (
                  <View key={i.id} style={styles.row}>
                    <PersonBadge person={i.invitee} />
                    <View style={styles.text}>
                      <AppText variant="bodyStrong">{personName(i.invitee)}</AppText>
                      <AppText variant="small">{handle(i.invitee)} · waiting for an answer</AppText>
                    </View>
                    <RolePill role={i.role} />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Withdraw invitation to ${personName(i.invitee)}`}
                      hitSlop={10}
                      onPress={() => act.cancelInvite.mutate({ id: id!, inviteId: i.id }, { onError: fail })}
                    >
                      <AppText variant="bodyStrong" color={Palette.clayFg}>
                        Withdraw
                      </AppText>
                    </Pressable>
                  </View>
                ))}
              </>
            ) : null}

            {err ? <Banner kind="error">{err}</Banner> : null}
            {owner ? <Button title="Rename" icon="pen" kind="secondary" onPress={() => setRenaming(true)} /> : null}
            <Button
              title={owner ? "Delete journal" : "Leave journal"}
              icon={owner ? "trash" : "right-from-bracket"}
              kind="danger"
              onPress={() => void leaveOrDelete()}
            />
          </View>
        ) : null}
        {dialog}
      </Sheet>
      <PromptSheet
        visible={renaming}
        title="Rename journal"
        label="Journal name"
        initial={journal?.name ?? ""}
        onClose={() => setRenaming(false)}
        onSubmit={(name) => {
          setRenaming(false);
          if (id && name.trim()) act.rename.mutate({ id, name: name.trim().slice(0, LIMIT.nameMax) }, { onError: fail });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  person: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  text: { flex: 1 },
  manage: { gap: 6, paddingLeft: 50 },
});
