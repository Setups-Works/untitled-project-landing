import { ROLE_LABEL, ROLE_TONE } from "@untitled/logic";
import type { SharedJournalRole } from "../types";

/** The role a person has in a journal, as a small tinted pill. */
export default function RolePill({ role }: { role: SharedJournalRole }) {
  return (
    <span className={`at-${ROLE_TONE[role]} tint shrink-0 rounded-pill px-2.5 py-[3px] text-[12px] font-medium`}>{ROLE_LABEL[role]}</span>
  );
}
