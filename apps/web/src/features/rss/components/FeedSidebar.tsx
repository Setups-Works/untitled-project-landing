"use client";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronRight, faCirclePlus, faEnvelope, faLayerGroup, faStar, faTableColumns, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { rssFeedName } from "@untitled/logic/rss";
import type { RssFeed, RssFilter } from "@untitled/types";
import { useState } from "react";
import FeedIcon from "./FeedIcon";

/**
 * The Reader's sidebar, built from the same `tsb` classes as the To-do sidebar (sand tint, icon rail when closed, drawer on phones).
 * "Views" show everything, unread or starred; "My feeds" shows one feed.
 */
export default function FeedSidebar({
  feeds,
  feedId,
  filter,
  totalUnread,
  collapsed,
  onView,
  onFeed,
  onAdd,
  onCollapse,
}: {
  feeds: RssFeed[];
  feedId: string | null;
  filter: RssFilter;
  totalUnread: number;
  /** Desktop "closed" state: the sidebar shrinks to a rail of icons. */
  collapsed: boolean;
  onView: (filter: RssFilter) => void;
  onFeed: (id: string) => void;
  onAdd: () => void;
  onCollapse: () => void;
}) {
  const [open, setOpen] = useState(true);
  const views: { key: RssFilter; label: string; icon: typeof faLayerGroup; count?: number }[] = [
    { key: "all", label: "All articles", icon: faLayerGroup },
    { key: "unread", label: "Unread", icon: faEnvelope, count: totalUnread },
    { key: "starred", label: "Starred", icon: faStar },
  ];

  return (
    <aside className="tsb at-sand" data-rail={collapsed} aria-label="Reader navigation">
      <div className="tsb-top">
        <button className="ne-btn" aria-label={collapsed ? "Show sidebar" : "Hide sidebar"} title={collapsed ? "Show sidebar" : "Hide sidebar"} onClick={onCollapse}>
          <FA icon={faTableColumns} />
        </button>
      </div>
      <button className="tsb-item tsb-add" aria-label="Add feed" title="Add feed" onClick={onAdd}>
        <FA icon={faCirclePlus} /> <span>Add feed</span>
      </button>
      <nav className="tsb-nav">
        {views.map((v) => {
          const on = feedId === null && filter === v.key;
          return (
            <button key={v.key} className="tsb-item" data-on={on} aria-current={on ? "page" : undefined} aria-label={v.label} title={v.label} onClick={() => onView(v.key)}>
              <FA icon={v.icon} /> <span>{v.label}</span>
              {!!v.count && <em>{v.count}</em>}
            </button>
          );
        })}
      </nav>

      <button className="tsb-sec" aria-expanded={open} onClick={() => setOpen(!open)} title="My feeds">
        <FA icon={open ? faChevronDown : faChevronRight} /> My feeds
      </button>
      {open && (
        <div className="tsb-lists">
          {feeds.length === 0 && <p className="tsb-hint">Feeds you follow show up here. Add your first one above.</p>}
          {feeds.map((f) => {
            const on = feedId === f.id;
            return (
              <button key={f.id} className="tsb-item" data-on={on} aria-current={on ? "page" : undefined} aria-label={rssFeedName(f)} title={f.last_error ?? rssFeedName(f)} onClick={() => onFeed(f.id)}>
                <FeedIcon src={f.image_url} name={rssFeedName(f)} className="size-5" /> <span>{rssFeedName(f)}</span>
                {f.last_error && <FA icon={faTriangleExclamation} className="text-clay-fg" />}
                {!!f.unread && <em>{f.unread}</em>}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
