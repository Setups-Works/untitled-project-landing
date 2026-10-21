"use client";
import { useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faEnvelope, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import type { SharedJournalInviteRole } from "../types";
import RoleSelect from "./RoleSelect";

/** Invite someone by username or email address. Resolves to true when the invitation was sent, so the form can clear itself. */
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
          {username.includes("@") && !username.startsWith("@") ? <FA icon={faEnvelope} /> : "@"}
        </span>
        <input
          className="w-full cursor-text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username or email"
          aria-label="Username or email to invite"
          maxLength={254}
          type="text"
          inputMode="email"
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
