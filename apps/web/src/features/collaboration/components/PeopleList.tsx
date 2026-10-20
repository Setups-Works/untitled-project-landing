"use client";
import { personName } from "@untitled/logic";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import type { SharedJournalDetail, SharedJournalInvite, SharedJournalInviteRole, SharedJournalMember } from "../types";
import PersonAvatar from "./PersonAvatar";
import RolePill from "./RolePill";
import RoleSelect from "./RoleSelect";

const Row = ({ children }: { children: React.ReactNode }) => (
  <li className="glass flex flex-wrap items-center gap-3 rounded-r2 px-3 py-2.5">{children}</li>
);

const handle = (p: { username: string | null }) => (p.username ? `@${p.username}` : "No username");

/** Everyone in the journal. The owner changes roles and removes people; everyone else just sees who is here. */
export function Members({
  journal,
  onRole,
  onRemove,
}: {
  journal: SharedJournalDetail;
  onRole: (m: SharedJournalMember, role: SharedJournalInviteRole) => void;
  onRemove: (m: SharedJournalMember) => void;
}) {
  const isOwner = journal.role === "owner";
  return (
    <ul className="flex flex-col gap-2" aria-label="People in this journal">
      {journal.members.map((m) => {
        const isMe = m.person.id === journal.me;
        return (
          <Row key={m.person.id}>
            <PersonAvatar person={m.person} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-medium">
                {personName(m.person)} {isMe && <span className="font-normal text-fg-subtle">(you)</span>}
              </p>
              <p className="truncate text-[12.5px] text-fg-subtle">{handle(m.person)}</p>
            </div>
            {isOwner && m.role !== "owner" ? (
              <>
                <RoleSelect value={m.role} label={`Role for ${personName(m.person)}`} onChange={(role) => onRole(m, role)} />
                <button
                  type="button"
                  className="ne-btn"
                  aria-label={`Remove ${personName(m.person)}`}
                  title="Remove"
                  onClick={() => onRemove(m)}
                >
                  <FA icon={faXmark} />
                </button>
              </>
            ) : (
              <RolePill role={m.role} />
            )}
          </Row>
        );
      })}
    </ul>
  );
}

/** Invitations the owner sent that haven't been answered yet. */
export function PendingInvites({ invites, onCancel }: { invites: SharedJournalInvite[]; onCancel: (i: SharedJournalInvite) => void }) {
  if (!invites.length) return null;
  return (
    <ul className="flex flex-col gap-2" aria-label="Invitations waiting for an answer">
      {invites.map((i) => (
        <Row key={i.id}>
          <PersonAvatar person={i.invitee} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] font-medium">{personName(i.invitee)}</p>
            <p className="truncate text-[12.5px] text-fg-subtle">{handle(i.invitee)} · waiting for an answer</p>
          </div>
          <RolePill role={i.role} />
          <button
            type="button"
            className="ne-btn"
            aria-label={`Withdraw invitation to ${personName(i.invitee)}`}
            title="Withdraw"
            onClick={() => onCancel(i)}
          >
            <FA icon={faXmark} />
          </button>
        </Row>
      ))}
    </ul>
  );
}
