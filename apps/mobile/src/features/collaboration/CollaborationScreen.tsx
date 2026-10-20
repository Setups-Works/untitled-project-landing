import { SHARED_JOURNAL as LIMIT } from "@untitled/logic";
import type { SharedJournal } from "@untitled/types";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useCollaborationActions, useMyInvites, useSharedJournals } from "./queries";
import { InviteCard } from "./components/InviteCard";
import { JournalCard } from "./components/JournalCard";
import { ManageSheet } from "./components/ManageSheet";
import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { BarButton, DetailBar } from "@/components/ui/DetailBar";
import { Button } from "@/components/ui/Button";
import { PromptSheet } from "@/components/ui/PromptSheet";
import { Screen } from "@/components/ui/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { errorMessage } from "@/lib/api";

function Section({ title, journals, onManage }: { title: string; journals: SharedJournal[]; onManage: (id: string) => void }) {
  if (!journals.length) return null;
  return (
    <View style={styles.section}>
      <AppText variant="label">
        {title.toUpperCase()} · {journals.length}
      </AppText>
      {journals.map((j) => (
        <JournalCard key={j.id} journal={j} onManage={() => onManage(j.id)} />
      ))}
    </View>
  );
}

/**
 * The collaboration page of the Journal: invitations waiting for you, the journals you own, and the journals others shared with you.
 * Writing happens on a journal's own page; people, roles and invitations are managed in the sheet opened from a card.
 */
export function CollaborationScreen({ embedded = false }: { embedded?: boolean } = {}) {
  const journalsQ = useSharedJournals();
  const invitesQ = useMyInvites();
  const act = useCollaborationActions();
  const [err, setErr] = useState("");
  const [managing, setManaging] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const journals = journalsQ.data ?? [];
  const invites = invitesQ.data ?? [];

  async function refresh() {
    setRefreshing(true);
    await Promise.all([journalsQ.refetch(), invitesQ.refetch()]);
    setRefreshing(false);
  }

  function create(name: string) {
    setCreating(false);
    const trimmed = name.trim().slice(0, LIMIT.nameMax);
    if (!trimmed) return;
    setErr("");
    act.create.mutate(trimmed, { onSuccess: (j) => setManaging(j.id), onError: (e) => setErr(errorMessage(e)) });
  }

  return (
    <Screen
      edges={embedded ? ["left", "right"] : ["top", "left", "right", "bottom"]}
      onRefresh={() => void refresh()}
      refreshing={refreshing}
    >
      {embedded ? (
        <Button title="New shared journal" icon="plus" onPress={() => setCreating(true)} />
      ) : (
        <DetailBar
          label="Collaboration"
          closeLabel="Back"
          onClose={() => router.back()}
          action={<BarButton title="New" onPress={() => setCreating(true)} />}
        />
      )}
      <AppText variant="body">Write a journal together. Invite people by username; they join when they accept.</AppText>
      {err ? <Banner kind="error">{err}</Banner> : null}

      {journalsQ.isPending || invitesQ.isPending ? (
        <LoadingState />
      ) : journalsQ.isError || invitesQ.isError ? (
        <ErrorState message={errorMessage(journalsQ.error ?? invitesQ.error)} onRetry={() => void refresh()} />
      ) : (
        <>
          {invites.length ? (
            <View style={styles.section}>
              <AppText variant="label">INVITATIONS · {invites.length}</AppText>
              {invites.map((i) => (
                <InviteCard
                  key={i.id}
                  invite={i}
                  busy={act.respond.isPending && act.respond.variables?.inviteId === i.id}
                  onAnswer={(action) => act.respond.mutate({ inviteId: i.id, action }, { onError: (e) => setErr(errorMessage(e)) })}
                />
              ))}
            </View>
          ) : null}
          {!journals.length && !invites.length ? (
            <EmptyState icon="user-group" title="No shared journals yet" hint="Start one and invite someone by their username." />
          ) : null}
          <Section title="Yours" journals={journals.filter((j) => j.role === "owner")} onManage={setManaging} />
          <Section title="Shared with you" journals={journals.filter((j) => j.role !== "owner")} onManage={setManaging} />
        </>
      )}

      <ManageSheet id={managing} onClose={() => setManaging(null)} />
      <PromptSheet
        visible={creating}
        title="New shared journal"
        label="Journal name"
        cta="Create"
        onClose={() => setCreating(false)}
        onSubmit={create}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ section: { gap: 10 } });
