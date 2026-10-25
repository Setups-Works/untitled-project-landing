"use client";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare, faEnvelope, faEnvelopeOpen, faStar, faXmark } from "@fortawesome/free-solid-svg-icons";
import { rssAge } from "@untitled/logic/rss";
import type { RssItem } from "@untitled/types";
import { useState } from "react";
import Modal from "../../../components/ui/Modal";
import type { RssActions } from "../queries";
import { useArticle } from "../queries";

/** The reader: the article's picture, title, source, and full text, with star, unread and "open original". */
export default function ArticleDialog({ preview, actions, onClose }: { preview: RssItem; actions: RssActions; onClose: () => void }) {
  const { data } = useArticle(preview.id);
  const item = data ?? preview;
  const [imageFailed, setImageFailed] = useState(false);
  const paragraphs = (item.content || item.summary).split(/\n{2,}/).filter(Boolean);
  const date = new Date(item.published_at).toLocaleDateString(undefined, { dateStyle: "medium" });

  return (
    <Modal label={item.title} onClose={onClose} size="lg">
      <article className="td gap-4!">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[12.5px] text-fg-muted">
            {item.feed_title}
            {item.author ? ` · ${item.author}` : ""} · <time dateTime={item.published_at} title={date}>{rssAge(item.published_at)}</time>
          </p>
          <div className="flex shrink-0 gap-1.5">
            <button type="button" className="ne-btn" data-on={item.is_starred} aria-pressed={item.is_starred} aria-label={item.is_starred ? "Remove star" : "Star article"} onClick={() => actions.setStarred(item.id, !item.is_starred)}>
              <FA icon={faStar} className={item.is_starred ? "text-amber-fg" : "text-fg-faint"} />
            </button>
            <button type="button" className="ne-btn" aria-label={item.is_read ? "Mark as unread" : "Mark as read"} onClick={() => actions.setRead(item.id, !item.is_read)}>
              <FA icon={item.is_read ? faEnvelope : faEnvelopeOpen} />
            </button>
            <button type="button" className="ne-btn" aria-label="Close" onClick={onClose}>
              <FA icon={faXmark} />
            </button>
          </div>
        </div>
        {item.image_url && !imageFailed && (
          // eslint-disable-next-line @next/next/no-img-element -- article pictures come from any site
          <img src={item.image_url} alt="" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} className="max-h-[320px] w-full rounded-r3 bg-surface-muted object-cover" />
        )}
        <h2 className="font-serif text-[clamp(26px,3vw,34px)] leading-[1.08] font-normal tracking-[-0.02em] text-balance">{item.title}</h2>
        <div className="flex flex-col gap-3 text-[15.5px] leading-relaxed text-fg">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm self-start">
            Open original <FA icon={faArrowUpRightFromSquare} />
          </a>
        )}
      </article>
    </Modal>
  );
}
