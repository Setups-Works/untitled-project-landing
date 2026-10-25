import { useEffect, useState, type ReactNode } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Palette, Radius, Shadow, Tints } from "@/constants/theme";
import { useRuntimePrefs } from "@/lib/preferences";

const MAX_WIDTH = 310;
/** Share of the screen width the drawer takes on a small phone (the web drawer uses the same 86 %). */
const WIDTH_SHARE = 0.86;

/** A panel that slides in from the left over a scrim, like the web's sidebar drawer. Tapping the scrim or going back closes it. */
export function SideDrawer({ visible, onClose, children, label }: { visible: boolean; onClose: () => void; children: ReactNode; label: string }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const preferences = useRuntimePrefs();
  const panelWidth = Math.min(MAX_WIDTH, width * WIDTH_SHARE);
  const [x] = useState(() => new Animated.Value(-panelWidth));

  useEffect(() => {
    if (!visible) return;
    if (preferences.reduceMotion) return x.setValue(0);
    x.setValue(-panelWidth);
    Animated.timing(x, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [visible, preferences.reduceMotion, panelWidth, x]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Close ${label}`} onPress={onClose} style={styles.scrim} />
      <Animated.View
        accessibilityViewIsModal
        accessibilityLabel={label}
        style={[styles.panel, { width: panelWidth, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8, transform: [{ translateX: x }] }]}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: Palette.scrim },
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    margin: 0,
    backgroundColor: Tints.sand.bg,
    borderTopRightRadius: Radius.r4,
    borderBottomRightRadius: Radius.r4,
    ...Shadow.e2,
  },
});
