import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { FlatList, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { parseChatActions, stripRefs, type ChatProposal } from "@untitled/validation";

import { Composer } from "./Composer";
import { uploadChatFile, type PendingFile } from "./files";
import { useAiProviders } from "./providers";
import { useChatActions, useMessages } from "./queries";
import { streamReply } from "./streamReply";
import { prettyTitle } from "./text";
import type { Message } from "./types";
import type { Attachment } from "@untitled/types";
import { AppText } from "@/components/ui/AppText";
import { AttachmentGallery } from "@/components/ui/AttachmentGallery";
import { Banner } from "@/components/ui/Banner";
import { Markdown } from "@/components/ui/Markdown";
import { Icon } from "@/components/ui/Icon";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Palette, Radius, Tints } from "@/constants/theme";
import { api, errorMessage } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import { Button } from "@/components/ui/Button";
import { greeting } from "@/lib/dates";
import { useAppState } from "@/providers/AppState";

const titleFrom = (text: string) => prettyTitle((text.split("\n")[0]?.trim() || "New chat").slice(0, 60));

/**
 * The conversation itself, shown right on the Chat tab. `chatId` is null for a new chat; the parent remounts this component
 * (via `key`) when another chat is picked, so each conversation starts with clean state and any streaming reply is aborted.
 */
export function Conversation({ chatId: initialId, onCreated }: { chatId: string | null; onCreated: (id: string) => void }) {
  const { user } = useAppState();
  const [chatId, setChatId] = useState<string | null>(initialId);
  const messagesQ = useMessages(chatId ?? undefined);
  const { providers, provider, select: selectProvider, loading: providersLoading } = useAiProviders();
  const { createChat, addMessage, refreshMessages } = useChatActions();
  const [error, setError] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const list = useRef<FlatList<Message>>(null);
  const insets = useSafeAreaInsets();
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboard(true));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboard(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  // The floating iOS tab bar covers the bottom of non-scrolling content, so the composer keeps the home-indicator inset plus a
  // small gap above it; while the keyboard is up the bar is covered and only a small gap remains. Android lays content out above its bar.
  const lift = Platform.OS === "ios" && !keyboard ? insets.bottom + 10 : 8;

  // Leaving the screen stops any reply still streaming.
  useEffect(() => () => abort.current?.abort(), []);

  async function send(text: string, files: PendingFile[], saved: () => void): Promise<boolean> {
    if (busy || (!text && !files.length) || !user) return false;
    setBusy(true);
    setError("");
    try {
      let target = chatId;
      if (!target) {
        const chat = await createChat.mutateAsync(titleFrom(text || files[0]?.name || "New chat"));
        if (!chat) throw new Error("Couldn’t start that chat.");
        target = chat.id;
        setChatId(target);
        onCreated(target); // lets the parent highlight this chat in the recents list without remounting
      }
      // Files go to storage first (a failed one is reported and skipped), then the message is saved with their descriptions.
      const attachments: Attachment[] = [];
      for (const f of files) {
        try {
          attachments.push(await uploadChatFile(user.id, target, f));
        } catch {
          setError(`Couldn’t upload ${f.name}.`);
        }
      }
      await addMessage.mutateAsync({ chatId: target, body: text || (attachments.length ? "Attachment" : ""), attachments });
      saved(); // the message is stored: empty the box now, not after the AI answers
      if (provider === "none") return true; // "No AI": the message is saved, no reply is generated
      const controller = new AbortController();
      abort.current = controller;
      setStreaming("");
      try {
        const failure = await streamReply({ chatId: target, provider, signal: controller.signal, onText: setStreaming });
        if (failure) setError(failure);
      } catch {
        if (!controller.signal.aborted) setError("The AI couldn’t reply. Your message was saved.");
      } finally {
        setStreaming(null);
        abort.current = null;
        await refreshMessages(target);
      }
      return true;
    } catch (e) {
      setError(errorMessage(e, "Couldn’t send that message."));
      return false;
    } finally {
      setBusy(false);
    }
  }

  const messages = messagesQ.data ?? [];
  // Not while the provider list is still loading: "No AI" is only the placeholder until the server answers.
  const noAi = provider === "none" && !providersLoading;

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {chatId && messagesQ.isPending ? (
          <LoadingState />
        ) : messagesQ.isError ? (
          <ErrorState message={errorMessage(messagesQ.error)} onRetry={() => void messagesQ.refetch()} />
        ) : (
          <FlatList
            ref={list}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messages}
            onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              streaming === null ? (
                <View style={styles.hello}>
                  <AppText variant="title" align="center">
                    {greeting()}
                    {user ? `, ${user.name.split(" ")[0]}` : ""}
                  </AppText>
                  <AppText variant="body" align="center" color={Palette.fgMuted}>
                    What’s on your mind?
                  </AppText>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <Bubble role={item.role} text={item.body} messageId={item.id} chatId={chatId} attachments={item.attachments} />
            )}
            ListFooterComponent={streaming !== null ? <Bubble role="assistant" text={streaming || "…"} /> : null}
          />
        )}

        {noAi ? (
          <View style={styles.pad}>
            <Banner kind="info">No AI is selected. Messages are saved to the chat without replies.</Banner>
          </View>
        ) : null}
        {error ? (
          <View style={styles.pad}>
            <Banner kind="error">{error}</Banner>
          </View>
        ) : null}

        {streaming !== null ? (
          <View style={styles.stopRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Stop reply"
              onPress={() => abort.current?.abort()}
              style={styles.stop}
            >
              <Icon name="stop" size={12} color={Palette.clayFg} />
              <AppText variant="small" color={Palette.clayFg}>
                Stop
              </AppText>
            </Pressable>
          </View>
        ) : null}

        <Composer
          busy={busy}
          providers={providers}
          provider={provider}
          onProvider={selectProvider}
          onSend={send}
          onError={setError}
          bottomInset={lift}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

function Bubble({
  role,
  text,
  messageId,
  chatId,
  attachments = [],
}: {
  role: "user" | "assistant";
  text: string;
  messageId?: string;
  chatId?: string | null;
  attachments?: Attachment[];
}) {
  const mine = role === "user";
  // Only the assistant's own messages are parsed for drafts; text a user types can never create items.
  const { body, proposals } = mine ? { body: text, proposals: [] as ChatProposal[] } : parseChatActions(text);
  return (
    <View style={[styles.bubbleRow, mine ? styles.mine : styles.theirs]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs, proposals.length ? styles.bubbleWide : null]}>
        {body && !(attachments.length && body === "Attachment") ? (
          mine ? (
            <AppText variant="body" color={Palette.onDark} selectable>
              {body}
            </AppText>
          ) : (
            <Markdown text={body} />
          )
        ) : null}
        {attachments.length ? <AttachmentGallery attachments={attachments} /> : null}
        {proposals.length && messageId && chatId ? <Drafts proposals={proposals} messageId={messageId} chatId={chatId} /> : null}
      </View>
    </View>
  );
}

const KIND = {
  journal: { tone: "violet", icon: "book-open", label: "journal entry", where: "Journal", href: "/journal" },
  task: { tone: "amber", icon: "list-check", label: "to-do", where: "To-do", href: "/todo" },
  note: { tone: "blue", icon: "pen-to-square", label: "note", where: "Notes", href: "/notes" },
} as const;

const dateLabel = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

/**
 * The drafts the assistant prepared (journal entry, to-dos, notes). Nothing is saved until the person taps Create; the server
 * (POST /api/v1/ai/actions) does the creating, exactly as for the web chat.
 */
function Drafts({ proposals, messageId, chatId }: { proposals: ChatProposal[]; messageId: string; chatId: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<number | "all" | null>(null);
  const [error, setError] = useState("");
  const pending = proposals.filter((p) => !p.created);

  async function create(which: number | "all") {
    setBusy(which);
    setError("");
    try {
      await api.post("/api/v1/ai/actions", { messageId, which });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["chat-messages", chatId] }),
        qc.invalidateQueries({ queryKey: qk.notes }),
        qc.invalidateQueries({ queryKey: qk.tasks }),
        qc.invalidateQueries({ queryKey: qk.journal }),
      ]);
    } catch (e) {
      setError(errorMessage(e, "Couldn’t create that item."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={styles.drafts} accessibilityLabel="Drafts to review">
      {proposals.map((p) => {
        const a = p.action;
        const k = KIND[a.kind];
        const t = Tints[k.tone];
        const preview = a.kind === "task" ? a.description : a.kind === "journal" ? stripRefs(a.body) : a.body;
        return (
          <View
            key={p.index}
            accessibilityLabel={`${k.label} draft`}
            style={[styles.draft, { backgroundColor: t.bg, borderColor: t.line }]}
          >
            <View style={styles.draftHead}>
              <View style={styles.draftIcon}>
                <Icon name={k.icon} size={12} color={t.fg} />
              </View>
              <AppText variant="label" color={t.fg}>
                {p.created ? `Saved to ${k.where}` : `${k.where} · draft`}
              </AppText>
            </View>
            {a.kind !== "journal" ? <AppText variant="bodyStrong">{a.title}</AppText> : null}
            {preview ? <Markdown text={preview.length > 600 ? `${preview.slice(0, 600)}…` : preview} color={Palette.fgMuted} /> : null}
            {a.kind === "task" ? (
              <AppText variant="small" color={t.fg}>
                {a.due_date ? `${a.recurrence ? "Starts" : "Due"} ${dateLabel(a.due_date)}` : "No due date"}
                {a.recurrence ? `  ·  Repeats ${a.recurrence.replace(/^nth:.*/, "monthly")}` : ""}
              </AppText>
            ) : null}
            {a.kind === "journal" ? (
              <AppText variant="small" color={t.fg}>
                For {dateLabel(a.entry_date)}
              </AppText>
            ) : null}
            {p.created ? (
              <Button title={`Open ${k.label}`} kind="secondary" onPress={() => router.navigate(k.href)} style={styles.draftBtn} />
            ) : (
              <Button
                title={`Create ${k.label}`}
                loading={busy === p.index}
                disabled={busy !== null}
                onPress={() => void create(p.index)}
                style={styles.draftBtn}
              />
            )}
          </View>
        );
      })}
      {pending.length > 1 ? (
        <Button
          title={`Create all ${pending.length}`}
          loading={busy === "all"}
          disabled={busy !== null}
          onPress={() => void create("all")}
        />
      ) : null}
      {error ? <Banner kind="error">{error}</Banner> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stopRow: { alignItems: "center", paddingBottom: 4 },
  stop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: Palette.clayBg,
  },
  safe: { flex: 1, backgroundColor: Palette.page },
  flex: { flex: 1 },
  bar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, minHeight: 48 },
  back: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  messages: { padding: 20, gap: 10, flexGrow: 1 },
  hello: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 80 },
  bubbleRow: { flexDirection: "row" },
  mine: { justifyContent: "flex-end" },
  theirs: { justifyContent: "flex-start" },
  bubble: { maxWidth: "86%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.r3, gap: 6 },
  bubbleWide: { width: "92%" },
  drafts: { gap: 10, marginTop: 4 },
  draft: { gap: 6, padding: 14, borderRadius: Radius.r2, borderWidth: 1 },
  draftHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  draftIcon: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    backgroundColor: Palette.glassHi,
    alignItems: "center",
    justifyContent: "center",
  },
  draftBtn: { alignSelf: "flex-start", minHeight: 40, marginTop: 4 },
  bubbleMine: { backgroundColor: Palette.fillDark, borderBottomRightRadius: 6 },
  bubbleTheirs: { backgroundColor: Palette.glassHi, borderWidth: 1, borderColor: Palette.glassRing, borderBottomLeftRadius: 6 },
  pad: { paddingHorizontal: 14, paddingTop: 8 },
  send: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: Palette.fillDark,
    alignItems: "center",
    justifyContent: "center",
  },
});
