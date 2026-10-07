"use client";
import { useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";

/**
 * An uploaded image. If the file can't be loaded (deleted, expired link, storage offline) it shows the file name and
 * "File unavailable" instead of the browser's broken-image icon.
 */
export default function AttachmentImage({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <span
        className="inline-flex max-w-full items-center gap-2 rounded-r2 bg-white/70 px-3 py-2 text-[13px] text-fg-muted shadow-[inset_0_0_0_1px_var(--line)]"
        role="img"
        aria-label={`${name} (file unavailable)`}
      >
        <FA icon={faImage} className="flex-none" />
        <span className="min-w-0 truncate">{name}</span>
        <span className="flex-none text-fg-subtle">· File unavailable</span>
      </span>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={name} onError={() => setFailed(true)} />;
}
