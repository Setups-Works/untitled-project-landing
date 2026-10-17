import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Conversation } from "./ConversationScreen";
import { RecentChatsDrawer } from "./RecentChatsDrawer";
import { useChats } from "./queries";
import { prettyTitle } from "./text";
import { AppText } from "@/components/ui/AppText";
import { Icon } from "@/components/ui/Icon";
import { Palette } from "@/constants/theme";

/**
 * The Chat tab: the conversation is right here (no separate screen), with a hamburger for recent chats and a button
 * for a new one. `run` remounts the conversation when the user picks or starts a chat, resetting its state.
 */
export function ChatScreen() {
  const chatsQ = useChats();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [run, setRun] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [seed, setSeed] = useState<string | undefined>();

  const open = (id: string | null, firstMessage?: string) => {
    setActiveId(id);
    setSeed(firstMessage);
    setRun((n) => n + 1);
    setDrawer(false);
  };

  // A message handed over from another screen (the Health actions): start a new chat with it. `n` makes a repeat tap count again.
  const { ask, n } = useLocalSearchParams<{ ask?: string; n?: string }>();
  useEffect(() => {
    if (ask) {
      setActiveId(null);
      setSeed(ask.slice(0, 500));
      setRun((r) => r + 1);
    }
  }, [ask, n]);
  const title = activeId ? prettyTitle(chatsQ.data?.find((c) => c.id === activeId)?.title ?? "Chat") : "New chat";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Recent chats"
          hitSlop={10}
          onPress={() => setDrawer(true)}
          style={styles.iconBtn}
        >
          <Icon name="bars" size={18} color={Palette.fg} />
        </Pressable>
        <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
          {title}
        </AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="New chat" hitSlop={10} onPress={() => open(null)} style={styles.iconBtn}>
          <Icon name="pen-to-square" size={17} color={Palette.fg} />
        </Pressable>
      </View>

      <Conversation key={run} chatId={activeId} seed={seed} onCreated={setActiveId} />

      <RecentChatsDrawer
        visible={drawer}
        activeId={activeId}
        onClose={() => setDrawer(false)}
        onSelect={open}
        onNew={() => open(null)}
        onDeleted={(id) => {
          if (id === activeId) open(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.page },
  bar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, minHeight: 52 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center" },
});
