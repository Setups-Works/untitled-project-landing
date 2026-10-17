"use client";

import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import Glass from "../../components/landing/Glass";
import { GITHUB_REPO } from "../../lib/site";
import { toneClass } from "../../lib/tones";
import { filterReleases, KIND_LABEL, PLATFORM_LABEL, RELEASES, type ChangeKind, type PlatformFilter } from "./releases";

const FILTERS: { id: PlatformFilter; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "web", label: "Web" },
  { id: "app", label: "Android app" },
];
const KIND_TONE: Record<ChangeKind, string> = { new: "at-green", improved: "at-blue", fixed: "at-clay" };

/** Dates are shown in the visitor's calendar, so this renders only on the client (see the page's ClientOnly wrapper). */
const day = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

export default function Changelog() {
  const [filter, setFilter] = useState<PlatformFilter>("all");
  const releases = filterReleases(RELEASES, filter);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Show changes for" className="glass inline-flex gap-1 rounded-pill p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className="h-9 rounded-pill px-4 text-[13.5px] font-medium text-fg-muted transition-colors aria-pressed:bg-white aria-pressed:text-fg aria-pressed:shadow-e1"
            >
              {f.label}
            </button>
          ))}
        </div>
        <a
          href={`${GITHUB_REPO}/releases`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary btn-sm"
        >
          View on GitHub <FA icon={faArrowUpRightFromSquare} />
        </a>
      </div>

      <ol className="mt-[clamp(24px,3.5vw,40px)] flex flex-col gap-5">
        {releases.map((r) => (
          <li key={`${r.date}-${r.title}`} className="grid gap-3 md:grid-cols-[180px_1fr] md:gap-8">
            <div className="md:pt-6">
              <time dateTime={r.date} className="text-[11px] font-semibold tracking-[0.1em] text-fg-faint uppercase">
                {day(r.date)}
              </time>
              {r.appVersion && (
                <a
                  href={`${GITHUB_REPO}/releases/tag/${r.appVersion}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`${toneClass(r.tone)} tint mt-2 flex w-fit items-center gap-1.5 rounded-[7px] px-2 py-[3px] font-mono text-[12px]`}
                >
                  App {r.appVersion} <FA icon={faArrowUpRightFromSquare} className="text-[10px]" />
                </a>
              )}
            </div>
            <Glass variant="flat" radius="r3" tone={r.tone} className="flex flex-col gap-4 p-6 sm:p-7">
              <div>
                <h2 className="font-serif text-[28px] leading-[1.1] font-normal tracking-[-0.022em] text-balance">{r.title}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{r.summary}</p>
              </div>
              <ul className="flex flex-col gap-3">
                {r.changes.map((c) => (
                  <li key={c.text} className="flex flex-wrap items-start gap-x-3 gap-y-1.5 text-[15px] leading-snug text-fg">
                    <span className="flex shrink-0 gap-1.5">
                      <span className={`${KIND_TONE[c.kind]} tint w-[78px] rounded-[7px] py-[3px] text-center text-[12px] font-medium`}>
                        {KIND_LABEL[c.kind]}
                      </span>
                      <span className="rounded-[7px] bg-white/60 px-2 py-[3px] text-[12px] text-fg-muted">{PLATFORM_LABEL[c.platform]}</span>
                    </span>
                    <span className="min-w-0 flex-1 basis-[240px]">{c.text}</span>
                  </li>
                ))}
              </ul>
            </Glass>
          </li>
        ))}
      </ol>
      {releases.length === 0 && <p className="ap-none mt-8 text-center text-fg-muted">Nothing here yet.</p>}
    </div>
  );
}
