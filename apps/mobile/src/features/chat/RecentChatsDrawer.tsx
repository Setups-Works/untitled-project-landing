import { Modal, Pressable, ScrollView, Share, StyleSheet, View, useWindowDimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { useChatActions, useChats } from "./queries";
import { ageShort, groupByDate, prettyTitle } from "./text";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Icon } from "@/components/ui/Icon";
import { DeleteSheet } from "@/components/ui/DeleteSheet";
import { PromptSheet } from "@/components/ui/PromptSheet";
import { Banner } from "@/components/ui/Banner";
import { Palette, Radius, Shadow } from "@/constants/theme";
import { api, errorMessage } from "@/lib/api";
import { mobileEnv } from "@/config/env";
import { dbQuery } from "./db";
import { deleteChatFile } from "./files";
import type { Chat, Message } from "./types";
import { useRef, useState } from "react";

const isUnread = (chat: Chat) => new Date(chat.updated_at).getTime() > new Date(chat.last_read_at).getTime() + 1000;

type Props = {
  visible: boolean;
  activeId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDeleted: (id: string) => void;
};

/** Slide-over list of recent chats, opened from the hamburger. Same list the web sidebar shows (newest first). */
export function RecentChatsDrawer({ visible, activeId, onClose, onSelect, onNew, onDeleted }: Props) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const chatsQ = useChats();
  const { removeChat, patchChat, duplicateChat, refreshMessages } = useChatActions();
  const [selected, setSelected] = useState<Chat | null>(null);
  const [menuCenterY, setMenuCenterY] = useState<number | null>(null);
  const menuAnchors = useRef(new Map<string, View>());
  const [rename, setRename] = useState<Chat | null>(null);
  const [confirm, setConfirm] = useState<"clear" | "delete" | null>(null);
  const [confirmChat, setConfirmChat] = useState<Chat | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function closeActions() {
    setSelected(null);
    setMenuCenterY(null);
  }

  function closeDrawer() {
    closeActions();
    onClose();
  }

  function openActions(chat: Chat) {
    setSelected(chat);
    setMenuCenterY(null);
    setError("");
    requestAnimationFrame(() => {
      menuAnchors.current.get(chat.id)?.measureInWindow((_x, y, _width, height) => setMenuCenterY(y + height / 2));
    });
  }

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function filesFor(chatId: string) {
    const messages = await dbQuery<Pick<Message, "attachments">[]>({
      table: "chat_messages", op: "select", columns: "attachments", filters: [{ column: "chat_id", op: "eq", value: chatId }],
    });
    return (messages ?? []).flatMap((message) => message.attachments ?? []).map((attachment) => attachment.path);
  }

  async function clearMessages(chat: Chat) {
    const paths = await filesFor(chat.id);
    await Promise.all(paths.map((path) => deleteChatFile(path)));
    await dbQuery({ table: "chat_messages", op: "delete", filters: [{ column: "chat_id", op: "eq", value: chat.id }] });
    await refreshMessages(chat.id);
    setConfirm(null);
    setConfirmChat(null);
    closeActions();
  }

  async function deleteChat(chat: Chat) {
    const paths = await filesFor(chat.id);
    await Promise.all(paths.map((path) => deleteChatFile(path)));
    await removeChat.mutateAsync(chat.id);
    onDeleted(chat.id);
    setConfirm(null);
    setConfirmChat(null);
    closeActions();
  }

  async function exportMarkdown(chat: Chat) {
    const messages = await dbQuery<Message[]>({
      table: "chat_messages", op: "select", columns: "id,role,body,created_at,attachments", filters: [{ column: "chat_id", op: "eq", value: chat.id }], order: [{ column: "created_at", ascending: true }],
    });
    const markdown = `# ${chat.title}\n\n${(messages ?? []).map((message) => `**${message.role === "user" ? "You" : "Assistant"}** · ${new Date(message.created_at).toLocaleString()}\n\n${message.body}\n`).join("\n")}`;
    await Share.share({ title: `${chat.title}.md`, message: markdown });
    closeActions();
  }

  async function toggleShare(chat: Chat) {
    const response = await api.post<{ data: { share_token: string | null } }>(`/api/v1/chats/${chat.id}/share`, { shared: !chat.share_token });
    await patchChat.mutateAsync({ id: chat.id, share_token: response.data.share_token });
    if (response.data.share_token) {
      await Share.share({ title: chat.title, message: `${chat.title}\n${mobileEnv.apiBaseUrl}/share/${response.data.share_token}` });
    }
    closeActions();
  }

  const groups = chatsQ.data ? groupByDate(chatsQ.data) : [];
  const panelWidth = Math.min(windowWidth * 0.82, 360);
  const menuWidth = Math.max(240, Math.min(panelWidth - 24, 310));
  const menuHeight = 414;
  const menuTop = menuCenterY === null ? 0 : Math.max(12, Math.min(menuCenterY - 22, windowHeight - menuHeight - 12));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeDrawer} statusBarTranslucent>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.gesture}>
          <View style={styles.root}>
            <SafeAreaView style={[styles.panel, Shadow.e2]} edges={["top", "bottom", "left"]}>
              <View style={styles.head}>
                <AppText variant="title" accessibilityRole="header" style={styles.drawerTitle}>
                  Recent chats
                </AppText>
                <Pressable accessibilityRole="button" accessibilityLabel="Close recent chats" hitSlop={12} onPress={closeDrawer}>
                  <AppText variant="bodyStrong" color={Palette.fgMuted}>
                    Close
                  </AppText>
                </Pressable>
              </View>
              <View style={styles.pad}>
                <Button title="New chat" icon="plus" onPress={() => { closeActions(); onNew(); }} style={styles.newChatButton} />
              </View>
              <ScrollView contentContainerStyle={styles.list}>
                {chatsQ.isPending ? (
                  <LoadingState />
                ) : chatsQ.isError ? (
                  <ErrorState message={errorMessage(chatsQ.error)} onRetry={() => void chatsQ.refetch()} />
                ) : chatsQ.data.length ? (
                  groups.map((group) => (
                    <View key={group.label}>
                      <AppText variant="bodyStrong" color={Palette.fgSubtle} style={styles.groupTitle}>{group.label}</AppText>
                      {group.items.map((c) => {
                        const on = c.id === activeId;
                        return (
                          <View key={c.id} style={styles.row}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Open chat: ${prettyTitle(c.title)}`}
                              accessibilityState={{ selected: on }}
                              accessibilityHint="Long press for more actions"
                              onPress={() => { closeActions(); onSelect(c.id); }}
                              onLongPress={() => openActions(c)}
                              delayLongPress={350}
                              style={[styles.item, on ? styles.itemOn : null]}
                            >
                              {c.pinned ? <Icon name="thumbtack" size={13} color={Palette.greenFg} /> : null}
                              <AppText variant="body" numberOfLines={1} style={styles.title}>
                                {prettyTitle(c.title)}
                              </AppText>
                              {isUnread(c) && c.id !== activeId ? <View style={styles.unreadDot} /> : null}
                              <AppText variant="small" color={Palette.fgSubtle}>{ageShort(c.updated_at)}</AppText>
                            </Pressable>
                            <Pressable
                              ref={(node) => { if (node) menuAnchors.current.set(c.id, node); else menuAnchors.current.delete(c.id); }}
                              accessibilityRole="button"
                              accessibilityLabel={`Options for ${prettyTitle(c.title)}`}
                              onPress={() => openActions(c)}
                              style={[styles.more, selected?.id === c.id ? styles.moreOn : null]}
                            >
                              <Icon name="ellipsis" size={16} color={Palette.fgMuted} />
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  ))
                ) : (
                  <AppText variant="small" align="center" style={styles.empty}>
                    No chats yet.
                  </AppText>
                )}
              </ScrollView>
              {error ? <View style={styles.pad}><Banner kind="error">{error}</Banner></View> : null}
            </SafeAreaView>
            {/* Tapping the dimmed area closes the drawer. */}
            <Pressable accessibilityRole="button" accessibilityLabel="Close recent chats" style={styles.scrim} onPress={closeDrawer} />
            {selected && menuCenterY !== null ? (
              <View style={styles.menuLayer}>
                <Pressable accessibilityRole="button" accessibilityLabel="Close chat actions" style={styles.menuBackdrop} onPress={closeActions} />
                <View style={[styles.menuCard, { top: menuTop, right: Math.max(12, windowWidth - panelWidth + 12), width: menuWidth }]}>
                  <ScrollView bounces={false}>
                    <Action icon="thumbtack" title={selected.pinned ? "Unpin" : "Pin"} onPress={() => {
                      const target = selected;
                      closeActions();
                      void act(() => patchChat.mutateAsync({ id: target.id, pinned: !target.pinned }).then(() => undefined));
                    }} />
                    <Action icon="pen" title="Rename" onPress={() => { setRename(selected); closeActions(); }} />
                    {selected.id !== activeId ? <Action icon={isUnread(selected) ? "envelope-open" : "envelope"} title={isUnread(selected) ? "Mark as read" : "Mark as unread"} onPress={() => {
                      const target = selected;
                      closeActions();
                      void act(async () => {
                        const read = isUnread(target);
                        await patchChat.mutateAsync({ id: target.id, last_read_at: read ? new Date().toISOString() : new Date(new Date(target.updated_at).getTime() - 5000).toISOString() });
                      });
                    }} /> : null}
                    <Action icon="clone" title="Duplicate" onPress={() => {
                      const target = selected;
                      closeActions();
                      void act(async () => { const copy = await duplicateChat.mutateAsync(target); onSelect(copy.id); });
                    }} />
                    <Action icon="share-nodes" title={selected.share_token ? "Stop sharing" : "Share"} onPress={() => void act(() => toggleShare(selected))} />
                    <Action icon="download" title="Export as Markdown" onPress={() => void act(() => exportMarkdown(selected))} />
                    <View style={styles.separator} />
                    <Action icon="eraser" title="Clear messages" danger onPress={() => { setConfirmChat(selected); setConfirm("clear"); closeActions(); }} />
                    <Action icon="trash" title="Delete" danger onPress={() => { setConfirmChat(selected); setConfirm("delete"); closeActions(); }} />
                  </ScrollView>
                </View>
              </View>
            ) : null}
          </View>
        </GestureHandlerRootView>
      </SafeAreaProvider>
      <PromptSheet visible={rename !== null} title="Rename chat" label="Chat name" initial={rename?.title ?? ""} cta="Save" onClose={() => setRename(null)} onSubmit={(title) => {
        if (!rename) return;
        const target = rename;
        setRename(null);
        void act(() => patchChat.mutateAsync({ id: target.id, title: title.slice(0, 200) }).then(() => undefined));
      }} />
      <DeleteSheet
        visible={confirm !== null}
        title={confirm === "clear" ? "Clear this chat?" : "Delete this chat?"}
        message={confirm === "clear" ? "All messages and their attachments will be deleted. The chat itself stays." : "This chat, its messages and attachments will be permanently deleted."}
        confirmLabel={confirm === "clear" ? "Clear messages" : "Delete chat"}
        error={error}
        loading={busy}
        onConfirm={() => {
          if (!confirmChat || !confirm) return;
          const chat = confirmChat;
          void act(() => (confirm === "clear" ? clearMessages(chat) : deleteChat(chat)));
        }}
        onClose={() => {
          setConfirm(null);
          setConfirmChat(null);
        }}
      />
    </Modal>
  );
}

function Action({ icon, title, onPress, danger = false }: { icon: "thumbtack" | "pen" | "envelope" | "envelope-open" | "clone" | "share-nodes" | "download" | "eraser" | "trash"; title: string; onPress: () => void; danger?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}>
    <Icon name={icon} size={16} color={danger ? Palette.clayFg : Palette.fgSubtle} />
    <AppText variant="body" color={danger ? Palette.clayFg : Palette.fg}>{title}</AppText>
  </Pressable>;
}

const styles = StyleSheet.create({
  gesture: { flex: 1 },
  root: { flex: 1, flexDirection: "row" },
  panel: { width: "82%", maxWidth: 360, backgroundColor: Palette.page },
  scrim: { flex: 1, backgroundColor: Palette.scrim },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  drawerTitle: { fontSize: 28, lineHeight: 32 },
  pad: { paddingHorizontal: 20, paddingBottom: 8 },
  newChatButton: { width: "100%" },
  list: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 24, gap: 2 },
  groupTitle: { paddingHorizontal: 12, paddingTop: 18, paddingBottom: 8 },
  item: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minHeight: 48, paddingHorizontal: 12, borderRadius: Radius.r2 },
  row: { flexDirection: "row", alignItems: "center", borderRadius: Radius.r2 },
  more: { width: 40, height: 44, alignItems: "center", justifyContent: "center" },
  moreOn: { backgroundColor: Palette.glassHi, borderRadius: Radius.pill, borderWidth: 1, borderColor: Palette.line },
  unreadDot: { width: 8, height: 8, borderRadius: Radius.pill, backgroundColor: Palette.greenFg },
  action: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 10 },
  separator: { height: 1, backgroundColor: Palette.line, marginVertical: 5 },
  itemOn: { backgroundColor: Palette.greenBg },
  title: { flex: 1 },
  empty: { paddingVertical: 24 },
  menuLayer: { ...StyleSheet.absoluteFill, zIndex: 5 },
  menuBackdrop: { ...StyleSheet.absoluteFill },
  menuCard: {
    position: "absolute",
    maxHeight: 430,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: Radius.r3,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
    ...Shadow.e2,
  },
});
