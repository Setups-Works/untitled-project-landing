"use client";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare, faBars, faCheckDouble, faMagnifyingGlass, faPlus, faRotate, faRss } from "@fortawesome/free-solid-svg-icons";
import { RSS, rssFeedName } from "@untitled/logic/rss";
import type { RssFilter, RssItem } from "@untitled/types";
import { useCallback, useMemo, useState } from "react";
import { useConfirm } from "../../../components/ui/Confirm";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useArticles, useAutoRefresh, useFeeds, useRssActions, useRssRealtime } from "../queries";
import AddFeedDialog from "./AddFeedDialog";
import ArticleCard from "./ArticleCard";
import ArticleDialog from "./ArticleDialog";
import FeedIcon from "./FeedIcon";
import FeedSidebar from "./FeedSidebar";

const SEARCH_DELAY_MS = 250;
const SIDE_KEY = "up_reader_sidebar";
/** Same breakpoint the To-do sidebar uses to become a drawer. */
const DRAWER_QUERY = "(max-width: 900px)";
const VIEW_TITLE = { all: "All articles", unread: "Unread", starred: "Starred" } as const;

const readSide = () => {
  try {
    return localStorage.getItem(SIDE_KEY) !== "false";
  } catch {
    return true;
  }
};

export default function ReaderApp() {
  useRssRealtime();
  const auto = useAutoRefresh();
  const feedsQ = useFeeds();
  const feeds = useMemo(() => feedsQ.data ?? [], [feedsQ.data]);
  const [feedId, setFeedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RssFilter>("all");
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
  const [open, setOpen] = useState<RssItem | null>(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [side, setSide] = useState(readSide);
  const [drawer, setDrawer] = useState(false);
  const { ask, dialog } = useConfirm();
  const actions = useRssActions(setNotice);

  // A feed that was unfollowed (here or on another device) falls back to "All articles".
  const feed = feeds.find((f) => f.id === feedId) ?? null;
  const articlesQ = useArticles({ feed: feed?.id, filter, q });
  const items = articlesQ.data?.pages.flatMap((p) => p.items) ?? [];
  const totalUnread = feeds.reduce((n, f) => n + f.unread, 0);
  const spinning = refreshing || auto.isFetching;

  const toggleSide = useCallback(() => {
    if (window.matchMedia(DRAWER_QUERY).matches) return setDrawer((d) => !d);
    setSide((s) => {
      try {
        localStorage.setItem(SIDE_KEY, String(!s));
      } catch {
        /* a private window: the choice just isn't remembered */
      }
      return !s;
    });
  }, []);
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

  async function refresh() {
    setRefreshing(true);
    setNotice("");
    const res = await actions.refresh(feed?.id);
    setRefreshing(false);
    if (res?.failed) setNotice(res.failed === 1 ? "One feed couldn’t be loaded." : `${res.failed} feeds couldn’t be loaded.`);
  }

  async function unfollow() {
    if (!feed) return;
    const ok = await ask({ title: `Unfollow ${rssFeedName(feed)}?`, body: "Its articles are removed from your reader.", confirmLabel: "Unfollow", danger: true });
    if (!ok) return;
    setFeedId(null);
    await actions.remove(feed.id);
  }

  async function addFeed(url: string) {
    const res = await actions.add(url);
    if ("error" in res) return { error: res.error };
    setFeedId(res.feed.id);
  }

  const open_ = (item: RssItem) => {
    setOpen(item);
    if (!item.is_read) void actions.setRead(item.id, true);
  };

  const title = feed ? rssFeedName(feed) : VIEW_TITLE[filter];
  const empty = !feedsQ.isPending && feeds.length === 0;

  return (
    <div className="tdo" data-side={side} data-drawer={drawer}>
      {dialog}
      {drawer && <div className="tdo-scrim" onClick={() => setDrawer(false)} />}
      <div className="tdo-sidewrap">
        <FeedSidebar
          feeds={feeds}
          feedId={feed?.id ?? null}
          filter={filter}
          totalUnread={totalUnread}
          collapsed={!side}
          onView={pickView}
          onFeed={pickFeed}
          onAdd={() => setAdding(true)}
          onCollapse={toggleSide}
        />
      </div>

      <main className="tdo-main">
        <header className="tdo-head">
          <button className="ne-btn tdo-menu" aria-label="Show sidebar" title="Show sidebar" data-show={!side} onClick={toggleSide}>
            <FA icon={faBars} />
          </button>
          <div className="tdo-title">
            <h1 className="h2">{title}</h1>
            {!empty && (
              <small>
                <FA icon={faRss} /> {totalUnread} unread
              </small>
            )}
          </div>
          <div className="tdo-tools">
            <button type="button" className="ne-btn" aria-label="Add feed" title="Add feed" onClick={() => setAdding(true)}>
              <FA icon={faPlus} />
            </button>
            <button type="button" className="ne-btn" aria-label="Refresh" title="Refresh" disabled={spinning || empty} onClick={refresh}>
              <FA icon={faRotate} className={spinning ? "animate-spin motion-reduce:animate-none" : ""} />
            </button>
            <button type="button" className="ne-btn" aria-label="Mark all as read" title="Mark all as read" disabled={totalUnread === 0} onClick={() => actions.readAll(feed?.id)}>
              <FA icon={faCheckDouble} />
            </button>
          </div>
        </header>

        {empty ? (
          <section className="ap-card at-green flex flex-col items-center gap-3 p-8 text-center">
            <span className="at-green tint grid size-12 place-items-center rounded-full text-[18px]" aria-hidden>
              <FA icon={faRss} />
            </span>
            <h2 className="h3">No feeds yet</h2>
            <p className="max-w-[380px] text-[14px] text-fg-muted">Add a feed or a website address and its latest articles will show up here.</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
              <FA icon={faPlus} /> Add your first feed
            </button>
          </section>
        ) : (
          <div className="flex min-w-0 flex-col gap-3.5">
            {feed && (
              <section className="ap-card flex flex-wrap items-center gap-3.5 p-3.5 sm:p-4" aria-label="About this feed">
                <FeedIcon src={feed.image_url} name={rssFeedName(feed)} className="size-12" />
                <div className="min-w-0 flex-1">
                  {feed.description && <p className="line-clamp-2 text-[13.5px] text-fg-muted">{feed.description}</p>}
                  {feed.last_error && (
                    <p className="at-clay tint mt-1 inline-block rounded-[7px] px-2 py-[3px] text-[12px]" role="status">
                      {feed.last_error}
                    </p>
                  )}
                </div>
                {feed.site_url && (
                  <a href={feed.site_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    Website <FA icon={faArrowUpRightFromSquare} />
                  </a>
                )}
                <button type="button" className="btn btn-secondary btn-sm" onClick={unfollow}>
                  Unfollow
                </button>
              </section>
            )}

            <label className="glass flex h-[42px] items-center gap-2 rounded-pill px-4 text-fg-muted focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-green-fg">
              <FA icon={faMagnifyingGlass} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={RSS.maxSearchLength}
                placeholder={feed ? `Search ${rssFeedName(feed)}` : "Search articles"}
                aria-label="Search articles"
                className="min-w-0 flex-1 border-0 bg-transparent p-0 font-sans text-[14px] text-fg outline-none!"
              />
            </label>

            {notice && (
              <p className="at-clay tint rounded-r2 px-3.5 py-2 text-[13.5px]" role="alert">
                {notice}
              </p>
            )}

            {articlesQ.isError ? (
              <p className="at-clay tint rounded-r3 p-4 text-[14px]" role="alert">
                Couldn’t load your articles. Please try again.
              </p>
            ) : articlesQ.isPending ? (
              <p className="p-6 text-xs text-fg-muted">Loading articles…</p>
            ) : items.length === 0 ? (
              <p className="ap-none">
                {q ? "No articles match your search." : filter === "unread" ? "You’re all caught up." : filter === "starred" ? "Star an article to keep it here." : "No articles yet. Try refreshing."}
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item.id}>
                    <ArticleCard item={item} onOpen={() => open_(item)} onStar={() => actions.setStarred(item.id, !item.is_starred)} />
                  </li>
                ))}
              </ul>
            )}
            {articlesQ.hasNextPage && (
              <button type="button" className="btn btn-secondary btn-sm self-center" disabled={articlesQ.isFetchingNextPage} onClick={() => articlesQ.fetchNextPage()}>
                {articlesQ.isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            )}
          </div>
        )}
      </main>

      {adding && <AddFeedDialog onAdd={addFeed} onClose={() => setAdding(false)} />}
      {open && <ArticleDialog preview={items.find((i) => i.id === open.id) ?? open} actions={actions} onClose={() => setOpen(null)} />}
    </div>
  );
}
