"use client";
import { SHARED_JOURNAL as LIMIT } from "@untitled/logic";
import { useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import type { SharedJournalInviteRole } from "../types";
import RoleSelect from "./RoleSelect";

/** Invite someone by username. Resolves to true when the invitation was sent, so the form can clear itself. */
export default function InviteForm({
  onInvite,
  full,
}: {
  onInvite: (username: string, role: SharedJournalInviteRole) => Promise<boolean>;
  full: boolean;
}) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<SharedJournalInviteRole>("editor");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || busy) return;
    setBusy(true);
    if (await onInvite(username, role)) setUsername("");
    setBusy(false);
  }

  return (
    <form className="flex flex-wrap items-center gap-2" onSubmit={submit}>
      <label className="tf-pill min-w-[180px] flex-1">
        <span aria-hidden className="text-fg-faint">
          @
        </span>
        <input
          className="w-full cursor-text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          aria-label="Username to invite"
          maxLength={LIMIT.usernameMax + 1}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          disabled={full}
        />
      </label>
      <RoleSelect value={role} onChange={setRole} label="Role for the invited person" disabled={full} />
      <button className="btn btn-primary btn-sm" disabled={busy || full || !username.trim()}>
        <FA icon={faPaperPlane} aria-hidden /> Send invitation
      </button>
    </form>
  );
}
