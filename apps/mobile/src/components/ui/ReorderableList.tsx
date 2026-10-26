import { moveItem } from "@untitled/logic";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Shadow } from "@/constants/theme";
import { useRuntimePrefs } from "@/lib/preferences";

export type ReorderItem = { id: string; node: ReactNode | null };

type Props = {
  /** Items in the order to show them. Items whose node is null are skipped. */
  items: ReorderItem[];
  gap: number;
  onReorder: (ids: string[]) => void;
};

type Drag = { id: string; from: number; to: number };

/**
 * A column of sections you can reorder: touch and hold one, then drag it up or down. The others slide out of the way and the new
 * order is reported when you let go. Hold-to-drag keeps normal scrolling and taps on the cards working.
 */
export function ReorderableList({ items, gap, onReorder }: Props) {
  const visible = items.filter((item) => item.node);
  const ids = visible.map((item) => item.id);
  const heights = useRef<Record<string, number>>({});
  const [drag, setDrag] = useState<Drag | null>(null);

  const tops = () => {
    let y = 0;
    return ids.map((id) => {
      const top = y;
      y += (heights.current[id] ?? 0) + gap;
      return top;
    });
  };

  function begin(id: string) {
    const from = ids.indexOf(id);
    if (from < 0) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    setDrag({ id, from, to: from });
  }

  function move(translation: number) {
    setDrag((current) => {
      if (!current) return current;
      const positions = tops();
      const centre = positions[current.from]! + (heights.current[current.id] ?? 0) / 2 + translation;
      let to = positions.length - 1;
      for (let i = 0; i < positions.length; i++) {
        if (centre < positions[i]! + (heights.current[ids[i]!] ?? 0) + gap / 2) {
          to = i;
          break;
        }
      }
      if (to === current.to) return current;
      void Haptics.selectionAsync().catch(() => undefined);
      return { ...current, to };
    });
  }

  function finish() {
    if (drag && drag.from !== drag.to) onReorder(moveItem(ids, drag.from, drag.to));
    setDrag(null);
  }

  return (
    <View style={{ gap }}>
      {visible.map((item, index) => (
        <ReorderRow
          key={item.id}
          index={index}
          drag={drag}
          gap={gap}
          heightOf={(id) => heights.current[id] ?? 0}
          id={item.id}
          onLayoutHeight={(height) => {
            heights.current[item.id] = height;
          }}
          onBegin={begin}
          onMove={move}
          onFinish={finish}
        >
          {item.node}
        </ReorderRow>
      ))}
    </View>
  );
}

function ReorderRow({
  id,
  index,
  drag,
  gap,
  heightOf,
  onLayoutHeight,
  onBegin,
  onMove,
  onFinish,
  children,
}: {
  id: string;
  index: number;
  drag: Drag | null;
  gap: number;
  heightOf: (id: string) => number;
  onLayoutHeight: (height: number) => void;
  onBegin: (id: string) => void;
  onMove: (translation: number) => void;
  onFinish: () => void;
  children: ReactNode;
}) {
  const { reduceMotion } = useRuntimePrefs();
  const active = drag?.id === id;
  const shift = useSharedValue(0);
  const translation = useSharedValue(0);

  // Sections between the dragged one's old and new place slide by its height to open a gap.
  let offset = 0;
  if (drag && !active) {
    const lift = heightOf(drag.id) + gap;
    if (drag.from < drag.to && index > drag.from && index <= drag.to) offset = -lift;
    if (drag.from > drag.to && index >= drag.to && index < drag.from) offset = lift;
  }
  useEffect(() => {
    shift.value = reduceMotion ? offset : withTiming(offset, { duration: 160 });
  }, [offset, reduceMotion, shift]);

  const pan = Gesture.Pan()
    .activateAfterLongPress(320)
    .onStart(() => {
      scheduleOnRN(onBegin, id);
    })
    .onUpdate((event) => {
      translation.value = event.translationY;
      scheduleOnRN(onMove, event.translationY);
    })
    .onFinalize(() => {
      translation.value = 0;
      scheduleOnRN(onFinish);
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: active ? translation.value : shift.value }, { scale: active ? 1.02 : 1 }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        onLayout={(event) => onLayoutHeight(event.nativeEvent.layout.height)}
        accessibilityHint="Touch and hold, then drag to move this section"
        style={[style, active ? styles.lifted : null]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  lifted: { zIndex: 10, ...Shadow.e2 },
});
