import { ROLE_HELP, ROLE_LABEL, personName } from "@untitled/logic";
import type { SharedJournalInvite } from "../types";
import PersonAvatar from "./PersonAvatar";

/** An invitation to join someone's journal, with the two answers. */
export default function InviteCard({
  invite,
  busy,
  onAnswer,
}: {
  invite: SharedJournalInvite;
  busy: boolean;
  onAnswer: (action: "accept" | "decline") => void;
}) {
  return (
    <li className="ap-card at-amber flex flex-wrap items-center gap-3 p-4">
      <PersonAvatar person={invite.inviter} />
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] text-balance">
          <b className="font-semibold">{personName(invite.inviter)}</b> invited you to{" "}
          <b className="font-semibold">{invite.journal_name}</b>
        </p>
        <p className="text-[12.5px] text-fg-subtle">
          As {ROLE_LABEL[invite.role].toLowerCase()}. {ROLE_HELP[invite.role]}
        </p>
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => onAnswer("decline")}>
          Decline
        </button>
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => onAnswer("accept")}>
          Accept
        </button>
      </div>
    </li>
  );
}
