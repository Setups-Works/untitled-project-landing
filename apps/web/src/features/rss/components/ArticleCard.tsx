"use client";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { rssAge } from "@untitled/logic/rss";
import type { RssItem } from "@untitled/types";
import { useState } from "react";
import FeedIcon from "./FeedIcon";

/** One article in the list: picture, title, description, source and age, with a star. */
export default function ArticleCard({ item, onOpen, onStar }: { item: RssItem; onOpen: () => void; onStar: () => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article className="glass glass-hover relative flex gap-3.5 rounded-r3 p-3.5 sm:p-4">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 gap-3.5 text-left" aria-label={`Open ${item.title}`}>
        {item.image_url && !imageFailed && (
          // eslint-disable-next-line @next/next/no-img-element -- article pictures come from any site
          <img
            src={item.image_url}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="size-[88px] shrink-0 rounded-r2 bg-surface-muted object-cover sm:size-[120px]"
          />
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={`line-clamp-2 text-[15px] leading-snug ${item.is_read ? "font-normal text-fg-muted" : "font-semibold text-fg"}`}>{item.title}</span>
          {item.summary && <span className="line-clamp-2 text-[13.5px] leading-snug text-fg-muted sm:line-clamp-3">{item.summary}</span>}
          <span className="mt-auto flex items-center gap-2 pt-1 text-[12px] text-fg-faint">
            {!item.is_read && <span aria-label="Unread" className="size-2 shrink-0 rounded-full bg-green-fg" />}
            <FeedIcon src={item.feed_image_url} name={item.feed_title} className="size-4" />
            <span className="truncate">{item.feed_title}</span>
            <span aria-hidden>·</span>
            <time dateTime={item.published_at} className="shrink-0">
              {rssAge(item.published_at)}
            </time>
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onStar}
        aria-pressed={item.is_starred}
        aria-label={item.is_starred ? "Remove star" : "Star article"}
        data-on={item.is_starred}
        className="ne-btn self-start"
      >
        <FA icon={faStar} className={item.is_starred ? "text-amber-fg" : "text-fg-faint"} />
      </button>
    </article>
  );
}
