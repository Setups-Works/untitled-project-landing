import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "./AppText";
import { Palette, Radius } from "@/constants/theme";
import { useRuntimePrefs } from "@/lib/preferences";

type Props = { visible: boolean; onClose: () => void; title?: string; children: ReactNode; scroll?: boolean };

/** Bottom sheet used for pickers and prompts (iOS and Android alike). Tapping the dimmed area closes it. */
export function Sheet({ visible, onClose, title, children, scroll = true }: Props) {
  const preferences = useRuntimePrefs();
  return (
    <Modal visible={visible} transparent animationType={preferences.reduceMotion ? "none" : "slide"} onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaProvider>
        <Body onClose={onClose} title={title} scroll={scroll}>
          {children}
        </Body>
      </SafeAreaProvider>
    </Modal>
  );
}

function Body({ onClose, title, children, scroll }: Omit<Props, "visible">) {
  const insets = useSafeAreaInsets();
  const Content = scroll ? ScrollView : View;
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close" style={styles.scrim} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.grab} />
        {title ? (
          <AppText variant="heading" style={styles.title} accessibilityRole="header">
            {title}
          </AppText>
        ) : null}
        <Content style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.contentChildren}>{children}</View>
        </Content>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: Palette.scrim },
  sheet: {
    backgroundColor: Palette.page,
    borderTopLeftRadius: Radius.r4,
    borderTopRightRadius: Radius.r4,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: "88%",
  },
  grab: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: Palette.lineStrong, marginBottom: 10 },
  title: { marginBottom: 8 },
  content: { flexGrow: 0 },
  contentChildren: { gap: 12 },
});
