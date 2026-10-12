"use client";
import { useEffect, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faBullhorn, faCircleCheck, faTriangleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";

type Item = { id: string; message: string; tone: string };
const KEY = "up_dismissed_ann";
const TONE: Record<string, string> = {
  info: "bg-blue-bg text-blue-fg",
  success: "bg-green-bg text-green-fg",
  warning: "bg-amber-bg text-amber-fg",
};
const ICON = { info: faBullhorn, success: faCircleCheck, warning: faTriangleExclamation } as const;

/** Announcements from the admin panel. Each user can dismiss one; the choice is remembered on this device. */
export default function AnnouncementBanner({ items }: { items: Item[] }) {
  const [gone, setGone] = useState<string[] | null>(null);
  useEffect(() => {
    try {
      setGone(JSON.parse(window.localStorage.getItem(KEY) || "[]"));
    } catch {
      setGone([]);
    }
  }, []);
  if (gone === null) return null;
  const shown = items.filter((i) => !gone.includes(i.id));
  if (!shown.length) return null;

  const dismiss = (id: string) => {
    const next = [...gone, id].slice(-50);
    setGone(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };
  return (
    <div className="mx-auto mt-[6px] flex max-w-[1120px] flex-col gap-2 px-[clamp(16px,3vw,32px)]" role="region" aria-label="Announcements">
      {shown.map((a) => (
        <div
          key={a.id}
          className={`flex items-center gap-3 rounded-r2 py-[10px] pr-3 pl-4 text-[14px] shadow-[inset_0_0_0_1px_var(--line)] ${TONE[a.tone] ?? TONE.info}`}
          role="status"
        >
          <FA icon={ICON[a.tone as keyof typeof ICON] ?? faBullhorn} />
          <p className="min-w-0 flex-1 [overflow-wrap:anywhere]">{a.message}</p>
          <button
            className="grid size-[30px] flex-none place-items-center rounded-full text-[12px] hover:bg-white/50"
            aria-label="Dismiss announcement"
            onClick={() => dismiss(a.id)}
          >
            <FA icon={faXmark} />
          </button>
        </div>
      ))}
    </div>
  );
}
