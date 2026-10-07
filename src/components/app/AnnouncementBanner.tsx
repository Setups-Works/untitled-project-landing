"use client";
import { useEffect, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faBullhorn, faCircleCheck, faTriangleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";

type Item = { id: string; message: string; tone: string };
const KEY = "up_dismissed_ann";
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
    <div className="ann-bar" role="region" aria-label="Announcements">
      {shown.map((a) => (
        <div key={a.id} className="ann-item" data-tone={a.tone} role="status">
          <FA icon={ICON[a.tone as keyof typeof ICON] ?? faBullhorn} />
          <p>{a.message}</p>
          <button aria-label="Dismiss announcement" onClick={() => dismiss(a.id)}>
            <FA icon={faXmark} />
          </button>
        </div>
      ))}
    </div>
  );
}
