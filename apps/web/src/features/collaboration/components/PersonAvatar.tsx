import { initials, toneFor } from "@untitled/logic";
import type { JournalPerson } from "../types";

const SIZE = { sm: "size-7 text-[11px]", md: "size-9 text-[13px]" } as const;

/** A round badge with a person's initials, in a colour that stays the same for that person everywhere. */
export default function PersonAvatar({ person, size = "md" }: { person: JournalPerson; size?: keyof typeof SIZE }) {
  return (
    <span aria-hidden className={`at-${toneFor(person.id)} tint grid shrink-0 place-items-center rounded-full font-semibold ${SIZE[size]}`}>
      {initials(person)}
    </span>
  );
}
