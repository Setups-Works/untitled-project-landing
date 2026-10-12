import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { useChatActions, useChats } from "./queries";
import { ageShort, prettyTitle } from "./text";
import { AppText } from "@/components/ui/AppText";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import { Button } from "@/components/ui/Button";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Palette, Radius, Shadow } from "@/constants/theme";
import { errorMessage } from "@/lib/api";

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
  const chatsQ = useChats();
  const { removeChat } = useChatActions();

  function deleteChat(id: string) {
    removeChat.mutate(id, { onSuccess: () => onDeleted(id), onError: (e) => Alert.alert("Couldn’t delete", errorMessage(e)) });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.gesture}>
          <View style={styles.root}>
            <SafeAreaView style={[styles.panel, Shadow.e2]} edges={["top", "bottom", "left"]}>
              <View style={styles.head}>
                <AppText variant="heading" accessibilityRole="header">
                  Recent chats
                </AppText>
                <Pressable accessibilityRole="button" accessibilityLabel="Close recent chats" hitSlop={12} onPress={onClose}>
                  <AppText variant="bodyStrong" color={Palette.fgMuted}>
                    Close
                  </AppText>
                </Pressable>
              </View>
              <View style={styles.pad}>
                <Button title="New chat" icon="plus" onPress={onNew} />
              </View>
              <ScrollView contentContainerStyle={styles.list}>
                {chatsQ.isPending ? (
                  <LoadingState />
                ) : chatsQ.isError ? (
                  <ErrorState message={errorMessage(chatsQ.error)} onRetry={() => void chatsQ.refetch()} />
                ) : chatsQ.data.length ? (
                  chatsQ.data.map((c) => {
                    const on = c.id === activeId;
                    return (
                      <SwipeToDelete
                        key={c.id}
                        title="Delete this chat?"
                        message={prettyTitle(c.title)}
                        what="chat"
                        onDelete={() => deleteChat(c.id)}
                      >
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Open chat: ${prettyTitle(c.title)}`}
                          accessibilityState={{ selected: on }}
                          onPress={() => onSelect(c.id)}
                          style={[styles.item, on ? styles.itemOn : null]}
                        >
                          <AppText variant="body" numberOfLines={1} style={styles.title}>
                            {prettyTitle(c.title)}
                          </AppText>
                          <AppText variant="small" color={Palette.fgSubtle}>
                            {ageShort(c.updated_at)}
                          </AppText>
                        </Pressable>
                      </SwipeToDelete>
                    );
                  })
                ) : (
                  <AppText variant="small" align="center" style={styles.empty}>
                    No chats yet.
                  </AppText>
                )}
              </ScrollView>
            </SafeAreaView>
            {/* Tapping the dimmed area closes the drawer. */}
            <Pressable accessibilityRole="button" accessibilityLabel="Close recent chats" style={styles.scrim} onPress={onClose} />
          </View>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </Modal>
  );
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
  pad: { paddingHorizontal: 20, paddingBottom: 8 },
  list: { paddingHorizontal: 12, paddingBottom: 24, gap: 2 },
  item: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 48, paddingHorizontal: 12, borderRadius: Radius.r2 },
  itemOn: { backgroundColor: Palette.greenBg },
  title: { flex: 1 },
  empty: { paddingVertical: 24 },
});
