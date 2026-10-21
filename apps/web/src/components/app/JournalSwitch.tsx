"use client";
import { isEnabled } from "../../config/features";
import { useCollaborationRealtime, useMyInvites } from "../../features/collaboration";
import PillSwitch, { type PillPage } from "./PillSwitch";

const PERSONAL = "/dashboard/journal";
const COLLAB = "/dashboard/journal/collaborate";

/**
 * Pill switch between your own journal and shared journals, at the top of both pages (like the Plan pages). Shared journal pages
 * (/dashboard/journal/shared/…) count as Collaboration. Invitations waiting for an answer show as a badge and arrive live.
 */
export default function JournalSwitch() {
  useCollaborationRealtime();
  const waiting = useMyInvites().data?.length ?? 0;
  if (!isEnabled("sharedJournals")) return null;
  const pages: PillPage[] = [
    { href: PERSONAL, t: "Personal", match: (p) => p === PERSONAL },
    { href: COLLAB, t: "Collaboration", match: (p) => p.startsWith(COLLAB) || p.startsWith("/dashboard/journal/shared"), badge: waiting },
  ];
  return <PillSwitch label="Journal" pages={pages} />;
}
