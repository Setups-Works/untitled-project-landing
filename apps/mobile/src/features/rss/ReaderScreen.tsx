import { useQueryClient } from "@tanstack/react-query";
import { RSS, rssFeedName } from "@untitled/logic";
import type { RssFilter } from "@untitled/types";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { AppState, FlatList, Linking, Pressable, RefreshControl, StyleSheet, TextInput, View, useWindowDimensions } from "react-native";

import { AddFeedSheet } from "./AddFeedSheet";
import { ArticleRow } from "./ArticleRow";
import { useArticles, useAutoRefresh, useFeeds, useRssActions } from "./queries";
import { ReaderSidebar } from "./ReaderSidebar";
import { useDebounced } from "./useDebounced";
import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConfirm } from "@/components/ui/Confirm";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SideDrawer } from "@/components/ui/SideDrawer";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Font, Palette, Radius, Space, Tints } from "@/constants/theme";
import { errorMessage } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

const SEARCH_DELAY_MS = 250;
/** Width at which the sidebar stays open beside the articles (a tablet, or the app running in a desktop browser). */
const WIDE = 760;
const SIDEBAR = 270;
const VIEW_TITLE: Record<RssFilter, string> = { all: "All articles", unread: "Unread", starred: "Starred" };

/** Follow feeds and read them: a sidebar (drawer on phones), search, refresh and add. Same shape as the web Reader. */
export function ReaderScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= WIDE;
  const qc = useQueryClient();
  useAutoRefresh();
  const feedsQ = useFeeds();
  const feeds = useMemo(() => feedsQ.data ?? [], [feedsQ.data]);
  const actions = useRssActions();
  const { ask, dialog } = useConfirm();
  const [feedId, setFeedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RssFilter>("all");
  const [search, setSearch] = useState("");
  const q = useDebounced(search.trim(), SEARCH_DELAY_MS);
  const [adding, setAdding] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Feeds and articles change on other devices (the web has realtime; the app has none), so catch up whenever the app is reopened.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => s === "active" && void qc.invalidateQueries({ queryKey: qk.rss.all }));
    return () => sub.remove();
  }, [qc]);

  // A feed that was unfollowed (here or on another device) falls back to "All articles".
  const feed = feeds.find((f) => f.id === feedId) ?? null;
  const articlesQ = useArticles({ feed: feed?.id, filter, q });
  const items = articlesQ.data?.pages.flatMap((p) => p.items) ?? [];
  const totalUnread = feeds.reduce((n, f) => n + f.unread, 0);
  const title = feed ? rssFeedName(feed) : VIEW_TITLE[filter];

  const pickView = (f: RssFilter) => {
    setFeedId(null);
    setFilter(f);
    setDrawer(false);
  };
  const pickFeed = (id: string) => {
    setFeedId(id);
    setFilter("all");
    setDrawer(false);
  };
  const openAdd = () => {
    setDrawer(false);
    setAdding(true);
  };

  const refresh = () => {
    setNotice(null);
    actions.refresh.mutate(feed?.id, {
      onSuccess: (r) => r.failed && setNotice(r.failed === 1 ? "One feed couldn’t be loaded." : `${r.failed} feeds couldn’t be loaded.`),
      onError: (e) => setNotice(errorMessage(e)),
    });
  };

  const unfollow = async () => {
    if (!feed) return;
    if (!(await ask({ title: `Unfollow ${rssFeedName(feed)}?`, body: "Its articles are removed from your reader.", confirmLabel: "Unfollow", danger: true }))) return;
    setFeedId(null);
    actions.remove.mutate(feed.id, { onError: (e) => setNotice(errorMessage(e)) });
  };

  const open = (id: string, isRead: boolean) => {
    if (!isRead) actions.setRead.mutate({ id, value: true });
    router.push({ pathname: "/reader/[id]", params: { id } });
  };

  const sidebar = (
    <ReaderSidebar feeds={feeds} feedId={feed?.id ?? null} filter={filter} totalUnread={totalUnread} onView={pickView} onFeed={pickFeed} onAdd={openAdd} />
  );

  if (feedsQ.isPending) return <LoadingState />;
  if (feedsQ.isError) return <ErrorState message="Couldn’t load your feeds." onRetry={() => void feedsQ.refetch()} />;

  const empty = feeds.length === 0;

  const controls = (
    <View style={styles.controls}>
      <View style={styles.titleRow}>
        {!wide ? <RoundButton icon="bars" label="Show sidebar" onPress={() => setDrawer(true)} /> : null}
        <View style={styles.flex}>
          <AppText variant="title" numberOfLines={1}>
            {title}
          </AppText>
          {!empty ? (
            <AppText variant="small" color={Palette.fgSubtle}>
              {totalUnread} unread
            </AppText>
          ) : null}
        </View>
        <RoundButton icon="plus" label="Add feed" onPress={() => setAdding(true)} />
        <RoundButton icon="check-double" label="Mark all as read" disabled={totalUnread === 0 || actions.readAll.isPending} onPress={() => actions.readAll.mutate(feed?.id)} />
      </View>
      <View style={styles.search}>
        <Icon name="magnifying-glass" size={14} color={Palette.fgSubtle} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          maxLength={RSS.maxSearchLength}
          placeholder={feed ? `Search ${rssFeedName(feed)}` : "Search articles"}
          placeholderTextColor={Palette.fgFaint}
          selectionColor={Palette.greenFg}
          accessibilityLabel="Search articles"
          returnKeyType="search"
          autoCorrect={false}
          style={styles.searchInput}
        />
      </View>
      {notice ? <Banner kind="error">{notice}</Banner> : null}
      {feed ? (
        <Card>
          {feed.description ? (
            <AppText variant="small" color={Palette.fgMuted} numberOfLines={3}>
              {feed.description}
            </AppText>
          ) : null}
          {feed.last_error ? (
            <AppText variant="small" color={Palette.clayFg}>
              {feed.last_error}
            </AppText>
          ) : null}
          <View style={styles.feedActions}>
            {feed.site_url ? <Button title="Website" kind="secondary" icon="arrow-up-right-from-square" onPress={() => void Linking.openURL(feed.site_url!)} style={styles.flex} /> : null}
            <Button title="Unfollow" kind="danger" onPress={() => void unfollow()} style={styles.flex} />
          </View>
        </Card>
      ) : null}
    </View>
  );

  const list = (
    <FlatList
      style={styles.flex}
      data={empty ? [] : items}
      keyExtractor={(i) => i.id}
      ListHeaderComponent={controls}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={Gap}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={actions.refresh.isPending} onRefresh={refresh} tintColor={Palette.greenFg} />}
      onEndReachedThreshold={0.6}
      onEndReached={() => articlesQ.hasNextPage && !articlesQ.isFetchingNextPage && void articlesQ.fetchNextPage()}
      renderItem={({ item }) => (
        <ArticleRow item={item} onOpen={() => open(item.id, item.is_read)} onStar={() => actions.setStarred.mutate({ id: item.id, value: !item.is_starred })} />
      )}
      ListEmptyComponent={
        empty ? (
          <EmptyState icon="rss" title="No feeds yet" hint="Add a feed or a website address and its latest articles will show up here." action={{ title: "Add your first feed", onPress: () => setAdding(true) }} />
        ) : articlesQ.isError ? (
          <ErrorState message="Couldn’t load your articles." onRetry={() => void articlesQ.refetch()} />
        ) : articlesQ.isPending ? (
          <LoadingState label="Loading articles…" />
        ) : (
          <AppText variant="small" align="center" color={Palette.fgMuted} style={styles.emptyText}>
            {q ? "No articles match your search." : filter === "unread" ? "You’re all caught up." : filter === "starred" ? "Star an article to keep it here." : "No articles yet. Pull down to refresh."}
          </AppText>
        )
      }
      ListFooterComponent={articlesQ.isFetchingNextPage ? <LoadingState label="Loading more…" /> : null}
    />
  );

  return (
    <View style={[styles.flex, wide ? styles.wideRow : null]}>
      {dialog}
      {wide ? <View style={styles.sidebar}>{sidebar}</View> : null}
      {list}
      {!wide ? (
        <SideDrawer visible={drawer} onClose={() => setDrawer(false)} label="Reader sidebar">
          {sidebar}
        </SideDrawer>
      ) : null}
      <AddFeedSheet visible={adding} onClose={() => setAdding(false)} onAdded={pickFeed} />
    </View>
  );
}

function RoundButton({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.round, disabled ? styles.roundOff : null]}>
      <Icon name={icon} size={15} color={Palette.fg} />
    </Pressable>
  );
}

const Gap = () => <View style={styles.gap} />;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wideRow: { flexDirection: "row" },
  sidebar: { width: SIDEBAR, margin: Space.md, marginTop: 0, borderRadius: Radius.r4, backgroundColor: Tints.sand.bg, borderWidth: 1, borderColor: Tints.sand.line },
  listContent: { paddingHorizontal: Space.lg, paddingBottom: Space.xxl * 2 },
  controls: { gap: Space.md, paddingBottom: Space.md },
  titleRow: { flexDirection: "row", alignItems: "center", gap: Space.sm },
  round: { width: 42, height: 42, borderRadius: Radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: Palette.glassHi, borderWidth: 1, borderColor: Palette.glassRing },
  roundOff: { opacity: 0.4 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
    minHeight: 48,
    paddingHorizontal: Space.lg,
    borderRadius: Radius.pill,
    backgroundColor: Palette.glassHi,
    borderWidth: 1,
    borderColor: Palette.glassRing,
  },
  searchInput: { flex: 1, ...Font.sans, fontSize: 16, color: Palette.fg, paddingVertical: Space.sm },
  feedActions: { flexDirection: "row", gap: Space.sm, marginTop: Space.sm },
  gap: { height: Space.md },
  emptyText: { paddingVertical: Space.xl },
});
