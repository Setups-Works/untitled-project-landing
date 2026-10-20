import { journalShareUrl, setJournalEntryShared } from "@untitled/api-client";
import type { JournalEntry } from "@untitled/types";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Share, StyleSheet, View } from "react-native";
import { captureRef } from "react-native-view-shot";

import { EntryImageCard } from "./EntryImageCard";
import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { mobileEnv } from "@/config/env";
import { api, errorMessage } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { shareImageWithText } from "@/lib/shareImage";

/**
 * Share one journal entry: a secret link anyone can open (read-only, no name, switched off any time) or a picture of the entry. The
 * link is the only way an entry leaves the private journal, so turning it on is always an explicit tap. Mount it only while open.
 */
export function EntryShareSheet({ entry, onClose }: { entry: JournalEntry; onClose: () => void }) {
  const qc = useQueryClient();
  const card = useRef<View>(null);
  const [token, setToken] = useState(entry.share_token);
  const [busy, setBusy] = useState<"link" | "stop" | "image" | "">("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const url = token ? journalShareUrl(mobileEnv.apiBaseUrl ?? "", token) : "";

  async function setShared(on: boolean) {
    const next = await setJournalEntryShared(api, entry.id, on);
    setToken(next);
    void qc.invalidateQueries({ queryKey: qk.journal });
    return next;
  }

  async function shareLink() {
    setBusy("link");
    setError("");
    try {
      const current = token ?? (await setShared(true));
      if (current) await Share.share({ title: "Journal entry", message: journalShareUrl(mobileEnv.apiBaseUrl ?? "", current) });
    } catch (e) {
      setError(errorMessage(e, "Couldn’t share the link."));
    } finally {
      setBusy("");
    }
  }

  async function stopSharing() {
    setBusy("stop");
    setError("");
    try {
      await setShared(false);
      setNote("The link no longer works.");
    } catch (e) {
      setError(errorMessage(e, "Couldn’t stop sharing."));
    } finally {
      setBusy("");
    }
  }

  async function shareImage() {
    if (!card.current) return;
    setBusy("image");
    setError("");
    try {
      const imageUri = await captureRef(card.current, { format: "png", quality: 1, result: "tmpfile", width: 1080 });
      await shareImageWithText({ title: "Journal entry", message: "From my journal", imageUri });
    } catch (e) {
      setError(errorMessage(e, "Couldn’t share the picture."));
    } finally {
      setBusy("");
    }
  }

  return (
    <Sheet visible onClose={onClose} title="Share entry">
      <View style={styles.stack}>
        <AppText variant="label">LINK</AppText>
        <AppText variant="small">
          {token
            ? "Anyone with the link can read this entry. It shows no name, and you can stop sharing at any time."
            : "Make a secret link to this one entry. Nothing else in your journal is shared."}
        </AppText>
        {url ? (
          <AppText variant="small" selectable numberOfLines={2}>
            {url}
          </AppText>
        ) : null}
        <Button
          title={token ? "Share link" : "Create link and share"}
          icon="link"
          loading={busy === "link"}
          disabled={busy !== ""}
          onPress={() => void shareLink()}
        />
        {token ? (
          <Button
            title="Stop sharing"
            kind="secondary"
            icon="link-slash"
            loading={busy === "stop"}
            disabled={busy !== ""}
            onPress={() => void stopSharing()}
          />
        ) : null}
        {note ? <Banner kind="success">{note}</Banner> : null}

        <AppText variant="label">IMAGE</AppText>
        <EntryImageCard ref={card} entry={entry} />
        <Button
          title="Share as image"
          icon="image"
          kind="secondary"
          loading={busy === "image"}
          disabled={busy !== ""}
          onPress={() => void shareImage()}
        />
        {error ? <Banner kind="error">{error}</Banner> : null}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({ stack: { gap: 12 } });
