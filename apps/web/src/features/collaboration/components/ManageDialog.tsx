"use client";
import { SHARED_JOURNAL as LIMIT, personName } from "@untitled/logic";
import { useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faPen, faRightFromBracket, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import Modal from "../../../components/ui/Modal";
import { useConfirm, usePrompt } from "../../../components/ui/Confirm";
import { useCollaborationActions, useSharedJournal } from "../hooks/useSharedJournals";
import InviteForm from "./InviteForm";
import { Members, PendingInvites } from "./PeopleList";
import RolePill from "./RolePill";

const SECTION = "text-[11px] font-semibold tracking-[0.1em] uppercase text-fg-faint";

/**
 * Everything about one journal's people in a dialog: who is in it, roles, invitations, rename, and leaving or deleting.
 * The owner sees all of it; members see the list and a Leave button. The server decides what each role may do.
 */
export default function ManageDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useSharedJournal(id);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const act = useCollaborationActions(setErr);
  const { ask, dialog } = useConfirm();
  const { prompt, dialog: promptDialog } = usePrompt();
  const journal = q.data;
  const owner = journal?.role === "owner";
  const people = journal ? journal.members.length + journal.invites.length : 0;

  async function invite(username: string, role: "editor" | "viewer") {
    setErr("");
    setNote("");
    const sent = await act.invite(id, username, role);
    const who = username.trim().replace(/^@/, "");
    // For an email address the answer is the same whether or not it has an account, so the message doesn't claim it was delivered.
    if (sent) setNote(who.includes("@") ? `If ${who} has an account, they’ve been emailed an invitation. They join when they accept.` : `Invitation sent to @${who}. They join when they accept.`);
    return Boolean(sent);
  }

  async function rename() {
    if (!journal) return;
    const name = await prompt({
      title: "Rename journal",
      label: "Journal name",
      initial: journal.name,
      confirmLabel: "Save",
      validate: (v) => (v.trim() ? null : "Give the journal a name."),
    });
    if (name?.trim()) await act.rename(id, name.trim());
  }

  async function leaveOrDelete() {
    if (!journal) return;
    const yes = await ask(
      owner
        ? {
            title: "Delete this journal?",
            body: <>“{journal.name}” and every entry in it will be permanently deleted for everyone.</>,
            confirmLabel: "Delete journal",
            danger: true,
          }
        : {
            title: "Leave this journal?",
            body: <>You’ll no longer see “{journal.name}”. The owner can invite you again.</>,
            confirmLabel: "Leave journal",
            danger: true,
          },
    );
    if (!yes) return;
    if ((await (owner ? act.remove(id) : act.removeMember(id, journal.me))) !== undefined) onClose();
  }

  return (
    <Modal label={journal ? `People in ${journal.name}` : "Journal people"} onClose={onClose} size="md">
      {dialog}
      {promptDialog}
      <div className="td">
        <div className="td-head">
          <h2 className="h3 min-w-0 [overflow-wrap:anywhere]">{journal?.name ?? "Journal"}</h2>
          {journal && <RolePill role={journal.role} />}
          <button type="button" className="ne-btn" aria-label="Close" onClick={onClose}>
            <FA icon={faXmark} />
          </button>
        </div>

        {q.isError && (
          <p className="form-err" role="alert">
            Couldn’t load this journal. It may have been deleted, or you’re no longer in it.
          </p>
        )}
        {journal && (
          <div className="flex flex-col gap-5">
            <section className="flex flex-col gap-2.5">
              <h3 className={SECTION}>People · {journal.members.length}</h3>
              <Members
                journal={journal}
                onRole={(m, role) => void act.setRole(id, m.person.id, role)}
                onRemove={async (m) => {
                  const yes = await ask({
                    title: `Remove ${personName(m.person)}?`,
                    body: "They’ll lose access to this journal. Their entries stay.",
                    confirmLabel: "Remove",
                    danger: true,
                  });
                  if (yes) await act.removeMember(id, m.person.id);
                }}
              />
            </section>

            {owner && (
              <section className="flex flex-col gap-2.5">
                <h3 className={SECTION}>Invite someone</h3>
                <InviteForm onInvite={invite} full={people >= LIMIT.maxPeople} />
                {note && (
                  <p className="text-[13px] text-green-fg" role="status">
                    {note}
                  </p>
                )}
                {people >= LIMIT.maxPeople && <p className="text-[13px] text-fg-subtle">A journal holds up to {LIMIT.maxPeople} people.</p>}
                <PendingInvites invites={journal.invites} onCancel={(i) => void act.cancelInvite(id, i.id)} />
              </section>
            )}

            {err && (
              <p className="form-err" role="alert">
                {err}
              </p>
            )}

            <div className="tf-acts items-center">
              {owner && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => void rename()}>
                  <FA icon={faPen} aria-hidden /> Rename
                </button>
              )}
              <button type="button" className="btn btn-secondary btn-sm td-del" onClick={() => void leaveOrDelete()}>
                <FA icon={owner ? faTrash : faRightFromBracket} aria-hidden /> {owner ? "Delete journal" : "Leave journal"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
