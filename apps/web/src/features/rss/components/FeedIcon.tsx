"use client";
import { useState } from "react";

/** A feed's logo, or its first letter when it has none (or the image fails to load). */
export default function FeedIcon({ src, name, className = "size-7" }: { src: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element -- feed logos come from any site, so they can't go through next/image
    return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={`${className} shrink-0 rounded-r1 bg-surface-muted object-cover`} />;
  }
  return (
    <i aria-hidden className={`${className} at-green tint grid shrink-0 place-items-center rounded-r1 text-[12px] font-semibold not-italic uppercase`}>
      {(name.trim()[0] ?? "?").toUpperCase()}
    </i>
  );
}
