import type { ReactNode } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

import { AppText } from "./AppText";
import { Palette, Radius, Shadow } from "@/constants/theme";
import { useRuntimePrefs } from "@/lib/preferences";

type Props = { visible: boolean; onClose: () => void; title?: string; children: ReactNode; scroll?: boolean };

/**
 * Bottom sheet styled to match the web's `.cd` confirm dialog / `.tm` modal:
 * frosted-white panel, inset hairline ring, deep shadow, and a springy pop-in animation.
 * Tapping the blurred scrim closes it.
 */
export function Sheet({ visible, onClose, title, children, scroll = true }: Props) {
  const preferences = useRuntimePrefs();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaProvider>
        <Body onClose={onClose} title={title} scroll={scroll} reduceMotion={preferences.reduceMotion}>
          {children}
        </Body>
      </SafeAreaProvider>
    </Modal>
  );
}

function Body({
  onClose,
  title,
  children,
  scroll,
  reduceMotion,
}: Omit<Props, "visible"> & { reduceMotion: boolean }) {
  const insets = useSafeAreaInsets();
  const Content = scroll ? ScrollView : View;

  // Scrim fade
  const [scrimOpacity] = useState(() => new Animated.Value(0));
  // Sheet: translate up + scale (mirrors web's cdPop: translateY(10px) scale(0.97))
  const [translateY] = useState(() => new Animated.Value(24));
  const [scale] = useState(() => new Animated.Value(0.97));

  useEffect(() => {
    if (reduceMotion) {
      scrimOpacity.setValue(1);
      translateY.setValue(0);
      scale.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.timing(scrimOpacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [reduceMotion, scrimOpacity, scale, translateY]);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Blurred scrim — uses semi-transparent cream page token */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrimBase, { opacity: scrimOpacity }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet panel */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 16 },
          { transform: [{ translateY }, { scale }] },
        ]}
      >
        {/* Grab handle */}
        <View style={styles.grab} />

        {title ? (
          <AppText variant="heading" style={styles.title} accessibilityRole="header">
            {title}
          </AppText>
        ) : null}

        <Content style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.contentChildren}>{children}</View>
        </Content>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },

  scrimBase: { backgroundColor: Palette.scrimLight },

  // Web .cd / .tm: surface background, inset 1px ring, --e4 shadow, r4 radius.
  sheet: {
    backgroundColor: Palette.surface,
    borderTopLeftRadius: Radius.r4,
    borderTopRightRadius: Radius.r4,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: "88%",
    // Inset 1px ring (web: inset 0 0 0 1px var(--line)) — simulated with borderWidth on top+sides only.
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Palette.line,
    // Deep shadow (web --e4 equivalent).
    ...Shadow.e2,
  },
  grab: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.lineStrong,
    marginBottom: 12,
  },
  title: { marginBottom: 12 },
  content: { flexGrow: 0 },
  contentChildren: { gap: 12 },
});
