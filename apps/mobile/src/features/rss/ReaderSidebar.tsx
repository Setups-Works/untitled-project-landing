import { rssFeedName } from "@untitled/logic";
import type { RssFeed, RssFilter } from "@untitled/types";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Palette, Radius, Space, Tints } from "@/constants/theme";

const VIEWS: { key: RssFilter; label: string; icon: IconName }[] = [
  { key: "all", label: "All articles", icon: "layer-group" },
  { key: "unread", label: "Unread", icon: "envelope" },
  { key: "starred", label: "Starred", icon: "star" },
];

/** The Reader's sidebar, like the web's: Add feed, views, then "My feeds" with logos and unread counts. A drawer on phones, a column on tablets. */
export function ReaderSidebar({
  feeds,
  feedId,
  filter,
  totalUnread,
  onView,
  onFeed,
  onAdd,
}: {
  feeds: RssFeed[];
  feedId: string | null;
  filter: RssFilter;
  totalUnread: number;
  onView: (filter: RssFilter) => void;
  onFeed: (id: string) => void;
  onAdd: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <ScrollView style={styles.panel} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Row icon="circle-plus" label="Add feed" strong tint onPress={onAdd} />
      <View style={styles.rule} />
      {VIEWS.map((v) => (
        <Row key={v.key} icon={v.icon} label={v.label} count={v.key === "unread" ? totalUnread : 0} on={feedId === null && filter === v.key} onPress={() => onView(v.key)} />
      ))}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={styles.section}>
        <Icon name={open ? "chevron-down" : "chevron-right"} size={11} color={Palette.fg} />
        <AppText variant="bodyStrong">My feeds</AppText>
      </Pressable>
      {open ? (
        feeds.length === 0 ? (
          <AppText variant="small" color={Palette.fgSubtle} style={styles.hint}>
            Feeds you follow show up here. Add your first one above.
          </AppText>
        ) : (
          feeds.map((f) => <Row key={f.id} feed={f} label={rssFeedName(f)} count={f.unread} on={feedId === f.id} onPress={() => onFeed(f.id)} />)
        )
      ) : null}
    </ScrollView>
  );
}

function Row({ icon, feed, label, count = 0, on, strong, tint, onPress }: { icon?: IconName; feed?: RssFeed; label: string; count?: number; on?: boolean; strong?: boolean; tint?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!on }} onPress={onPress} style={[styles.row, on ? styles.rowOn : null]}>
      {feed ? <FeedLogo feed={feed} /> : <Icon name={icon!} size={16} color={tint ? Tints.sand.fg : Palette.fgMuted} />}
      <AppText variant={strong || on ? "bodyStrong" : "body"} numberOfLines={1} style={styles.label}>
        {label}
      </AppText>
      {count > 0 ? (
        <AppText variant="small" color={Palette.fgSubtle}>
          {count}
        </AppText>
      ) : null}
    </Pressable>
  );
}

function FeedLogo({ feed }: { feed: RssFeed }) {
  const [failed, setFailed] = useState(false);
  if (feed.image_url && !failed) return <Image source={{ uri: feed.image_url }} style={styles.logo} onError={() => setFailed(true)} accessibilityIgnoresInvertColors />;
  return (
    <View style={[styles.logo, styles.letter]}>
      <AppText variant="small" color={Tints.green.fg} style={styles.letterText}>
        {(rssFeedName(feed)[0] ?? "?").toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1 },
  content: { padding: Space.md, gap: 2 },
  rule: { height: 1, backgroundColor: Palette.line, marginVertical: Space.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Space.md, minHeight: 46, paddingHorizontal: Space.md, borderRadius: Radius.r2 },
  rowOn: { backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line },
  label: { flex: 1 },
  section: { flexDirection: "row", alignItems: "center", gap: Space.sm, minHeight: 44, paddingHorizontal: Space.md, marginTop: Space.sm },
  hint: { paddingHorizontal: Space.md, paddingVertical: Space.sm },
  logo: { width: 22, height: 22, borderRadius: Radius.r1 / 2, backgroundColor: Palette.surfaceMuted },
  letter: { alignItems: "center", justifyContent: "center", backgroundColor: Tints.green.bg },
  letterText: { fontWeight: "600" },
});
