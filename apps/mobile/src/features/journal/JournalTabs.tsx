import { useRef, useState } from "react";
import { ScrollView, View, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JournalScreen } from "./JournalScreen";
import { CollaborationScreen } from "@/features/collaboration/CollaborationScreen";
import { useMyInvites } from "@/features/collaboration/queries";
import { Segmented } from "@/components/ui/Segmented";
import { Palette, Space } from "@/constants/theme";
import { useRuntimePrefs } from "@/lib/preferences";

const PAGES = ["personal", "collaborate"] as const;
type Page = (typeof PAGES)[number];

/**
 * The Journal tab: your own journal and your shared journals side by side. Drag sideways to move between them, or tap the switch at
 * the top (it also shows how many invitations are waiting). Each page scrolls up and down on its own.
 */
export function JournalTabs() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const prefs = useRuntimePrefs();
  const pager = useRef<ScrollView>(null);
  const [page, setPage] = useState<Page>("personal");
  const [height, setHeight] = useState(0);
  const waiting = useMyInvites().data?.length ?? 0;

  const go = (next: Page) => {
    setPage(next);
    pager.current?.scrollTo({ x: PAGES.indexOf(next) * width, animated: !prefs.reduceMotion });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Palette.page, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: Space.lg, paddingTop: Space.sm }}>
        <Segmented
          options={[
            { key: "personal", label: "Personal" },
            { key: "collaborate", label: "Collaborate", count: waiting },
          ]}
          value={page}
          onChange={go}
        />
      </View>
      <ScrollView
        ref={pager}
        style={{ flex: 1 }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={(e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height)}
        onMomentumScrollEnd={(e) =>
          setPage(PAGES[Math.min(Math.max(Math.round(e.nativeEvent.contentOffset.x / width), 0), PAGES.length - 1)]!)
        }
      >
        <View style={{ width, height }}>
          <JournalScreen edges={["left", "right"]} />
        </View>
        <View style={{ width, height }}>
          <CollaborationScreen embedded />
        </View>
      </ScrollView>
    </View>
  );
}
