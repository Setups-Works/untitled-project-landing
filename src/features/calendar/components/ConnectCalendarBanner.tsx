"use client";

import { useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faArrowRight, faXmark } from "@fortawesome/free-solid-svg-icons";

export default function ConnectCalendarBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Google Calendar integration banner"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-r2 border border-line bg-surface-muted/60 px-4 py-3 text-sm transition-colors hover:bg-surface-muted"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-bg/20 text-blue-fg">
          <FA icon={faCalendarDays} className="text-xs" />
        </span>
        <div>
          <p className="font-medium text-fg">Sync with Google Calendar</p>
          <p className="text-xs text-fg-muted">Connect your Google account in Settings to sync events two-way with Google Calendar.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1.5 rounded-pill bg-surface px-3 py-1.5 text-xs font-medium text-fg shadow-e1 hover:bg-surface-sunken"
        >
          <span>Connect Google</span>
          <FA icon={faArrowRight} className="text-[10px]" />
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          className="flex h-7 w-7 items-center justify-center rounded-pill text-fg-muted hover:bg-surface-sunken hover:text-fg"
        >
          <FA icon={faXmark} className="text-xs" />
        </button>
      </div>
    </div>
  );
}
