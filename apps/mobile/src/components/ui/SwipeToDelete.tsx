import type { ReactNode } from "react";
import { useRef } from "react";
import { Alert, Pressable, StyleSheet } from "react-native";
import ReanimatedSwipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

import { AppText } from "./AppText";
import { Icon } from "./Icon";
import { Palette, Radius } from "@/constants/theme";

type Props = {
  children: ReactNode;
  onDelete: () => void;
  /** What the confirmation asks, e.g. "Delete this note?". */
  title: string;
  message?: string;
  /** Used in the screen-reader label: "Delete <what>". */
  what: string;
};

/**
 * Slide a row left to reveal Delete. Tapping Delete asks for confirmation (there is no undo), then deletes.
 * Cancelling slides the row back.
 */
export function SwipeToDelete({ children, onDelete, title, message, what }: Props) {
  const ref = useRef<SwipeableMethods>(null);

  function ask() {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => ref.current?.close() },
      { text: "Delete", style: "destructive", onPress: onDelete },
    ]);
  }

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={48}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${what}`} onPress={ask} style={styles.action}>
          <Icon name="trash" size={16} color={Palette.onDark} />
          <AppText variant="small" color={Palette.onDark}>
            Delete
          </AppText>
        </Pressable>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  action: {
    width: 84,
    marginLeft: 8,
    borderRadius: Radius.r2,
    backgroundColor: Palette.rec,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});
