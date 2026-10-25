import { RSS, RSS_FILTERS, rssFeedName } from "@untitled/logic";
import type { RssFilter } from "@untitled/types";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Linking, RefreshControl, StyleSheet, TextInput, View, useWindowDimensions } from "react-native";

import { AddFeedSheet } from "./AddFeedSheet";
import { ArticleRow } from "./ArticleRow";
import { useArticles, useAutoRefresh, useFeeds, useRssActions } from "./queries";
import { useDebounced } from "./useDebounced";
import { AppText } from "@/components/ui/AppText";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConfirm } from "@/components/ui/Confirm";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Font, Palette, Radius, Space } from "@/constants/theme";
import { errorMessage } from "@/lib/api";

const SEARCH_DELAY_MS = 250;
/** Width at which the feeds sit in a column beside the articles (a tablet, or the app running in a desktop browser). */
const WIDE = 760;
const SIDEBAR = 240;
const ALL = "all";

/** Follow feeds and read them: feeds, search, filters, refresh and add. Chips on a phone, a sidebar on a tablet. */
export function ReaderScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= WIDE;
  useAutoRefresh();
  const feedsQ = useFeeds();
  const feeds = useMemo(() => feedsQ.data ?? [], [feedsQ.data]);
  const actions = useRssActions();
  const { ask, dialog } = useConfirm();
  const [feedId, setFeedId] = useState<string>(ALL);
  const [filter, setFilter] = useState<RssFilter>("all");
  const [search, setSearch] = useState("");
  const q = useDebounced(search.trim(), SEARCH_DELAY_MS);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // A feed that was unfollowed falls back to "All articles".
  const feed = feeds.find((f) => f.id === feedId) ?? null;
  const articlesQ = useArticles({ feed: feed?.id, filter, q });
  const items = articlesQ.data?.pages.flatMap((p) => p.items) ?? [];
  const totalUnread = feeds.reduce((n, f) => n + f.unread, 0);

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
    setFeedId(ALL);
    actions.remove.mutate(feed.id, { onError: (e) => setNotice(errorMessage(e)) });
  };

  const open = (id: string, isRead: boolean) => {
    if (!isRead) actions.setRead.mutate({ id, value: true });
    router.push({ pathname: "/reader/[id]", params: { id } });
  };

  const feedOptions = [{ key: ALL, label: "All articles", count: totalUnread }, ...feeds.map((f) => ({ key: f.id, label: rssFeedName(f), count: f.unread }))];

  if (feedsQ.isPending) return <LoadingState />;
  if (feedsQ.isError) return <ErrorState message="Couldn’t load your feeds." onRetry={() => void feedsQ.refetch()} />;

  if (feeds.length === 0)
    return (
      <View style={styles.flex}>
        <EmptyState icon="rss" title="No feeds yet" hint="Add a feed or a website address and its latest articles will show up here." action={{ title: "Add your first feed", onPress: () => setAdding(true) }} />
        <AddFeedSheet visible={adding} onClose={() => setAdding(false)} onAdded={setFeedId} />
      </View>
    );

  const controls = (
    <View style={styles.controls}>
      <View style={styles.searchRow}>
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
        <Button title="Add feed" icon="plus" onPress={() => setAdding(true)} style={styles.addButton} />
      </View>
      {!wide ? <Segmented options={feedOptions} value={feed?.id ?? ALL} onChange={setFeedId} /> : null}
      <View style={styles.filterRow}>
        <View style={styles.flex}>
          <Segmented options={RSS_FILTERS.map((f) => ({ key: f.key, label: f.label }))} value={filter} onChange={setFilter} />
        </View>
        <Button title="Mark all read" kind="ghost" disabled={totalUnread === 0 || actions.readAll.isPending} onPress={() => actions.readAll.mutate(feed?.id)} />
      </View>
      {notice ? <Banner kind="error">{notice}</Banner> : null}
      {feed ? (
        <Card>
          <AppText variant="bodyStrong">{rssFeedName(feed)}</AppText>
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
      data={items}
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
        articlesQ.isError ? (
          <ErrorState message="Couldn’t load your articles." onRetry={() => void articlesQ.refetch()} />
        ) : articlesQ.isPending ? (
          <LoadingState label="Loading articles…" />
        ) : (
          <AppText variant="small" align="center" color={Palette.fgMuted} style={styles.empty}>
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
      {wide ? (
        <View style={styles.sidebar}>
          {feedOptions.map((o) => (
            <Button key={o.key} title={o.count ? `${o.label}  ${o.count}` : o.label} kind={(feed?.id ?? ALL) === o.key ? "secondary" : "ghost"} onPress={() => setFeedId(o.key)} />
          ))}
        </View>
      ) : null}
      {list}
      <AddFeedSheet visible={adding} onClose={() => setAdding(false)} onAdded={setFeedId} />
    </View>
  );
}

const Gap = () => <View style={styles.gap} />;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wideRow: { flexDirection: "row" },
  sidebar: { width: SIDEBAR, paddingHorizontal: Space.md, gap: Space.xs },
  listContent: { paddingHorizontal: Space.lg, paddingBottom: Space.xxl * 2 },
  controls: { gap: Space.md, paddingBottom: Space.md },
  searchRow: { flexDirection: "row", alignItems: "center", gap: Space.sm },
  search: {
    flex: 1,
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
  addButton: { paddingHorizontal: Space.md },
  filterRow: { flexDirection: "row", alignItems: "center", gap: Space.sm },
  feedActions: { flexDirection: "row", gap: Space.sm, marginTop: Space.sm },
  gap: { height: Space.md },
  empty: { paddingVertical: Space.xl },
});
