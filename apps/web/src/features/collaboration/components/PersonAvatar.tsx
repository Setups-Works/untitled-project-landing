"use client";
import { useState } from "react";
import { initials, toneFor } from "@untitled/logic";
import type { JournalPerson } from "../types";

const SIZE = { sm: "size-7 text-[11px]", md: "size-9 text-[13px]" } as const;

/**
 * A round badge with a person's profile picture, or their initials (in a colour that stays the same for that person
 * everywhere) when they have no picture or it can't be loaded.
 */
export default function PersonAvatar({ person, size = "md" }: { person: JournalPerson; size?: keyof typeof SIZE }) {
  const [broken, setBroken] = useState(false);
  if (person.image && !broken)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatars are user uploads on our own storage, already sized
      <img
        src={person.image}
        alt=""
        aria-hidden
        loading="lazy"
        className={`shrink-0 rounded-full object-cover ${SIZE[size]}`}
        onError={() => setBroken(true)}
      />
    );
  return (
    <span aria-hidden className={`at-${toneFor(person.id)} tint grid shrink-0 place-items-center rounded-full font-semibold ${SIZE[size]}`}>
      {initials(person)}
    </span>
  );
}
