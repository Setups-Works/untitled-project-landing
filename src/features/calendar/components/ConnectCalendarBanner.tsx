"use client";

import Link from "next/link";
import { useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCalendarDays, faXmark } from "@fortawesome/free-solid-svg-icons";

const KEY = "up_cal_banner_dismissed";

/** Nudge to connect Google Calendar (UNT-72). Stays dismissed once the user closes it. */
export default function ConnectCalendarBanner() {
  const [hidden, setHidden] = useState(() => {
    try {
      return window.localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });
  if (hidden) return null;
  const dismiss = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* private mode: it just comes back next visit */
    }
  };
  return (
    <aside
      aria-label="Google Calendar"
      className="at-blue tint mb-[18px] flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-r3 px-4 py-3"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/70 text-[14px]">
        <FA icon={faCalendarDays} />
      </span>
      <p className="min-w-0 flex-1 basis-60 text-[13.5px] leading-snug">
        <b className="font-semibold">Bring in Google Calendar.</b>{" "}
        <span className="opacity-80">Connect it in Settings to see your events here and keep both in sync.</span>
      </p>
      <Link
        href="/dashboard/settings"
        className="inline-flex h-9 items-center gap-2 rounded-pill bg-white/80 px-4 text-[13.5px] font-medium shadow-e1 transition-colors hover:bg-white"
      >
        Connect <FA icon={faArrowRight} className="text-[11px]" />
      </Link>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="grid size-8 place-items-center rounded-full text-[12px] hover:bg-white/60"
      >
        <FA icon={faXmark} />
      </button>
    </aside>
  );
}
