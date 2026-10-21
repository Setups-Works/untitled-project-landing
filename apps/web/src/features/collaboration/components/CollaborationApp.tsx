"use client";
import { SHARED_JOURNAL as LIMIT } from "@untitled/logic";
import { useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { usePrompt } from "../../../components/ui/Confirm";
import { useCollaborationActions, useCollaborationRealtime, useMyInvites, useSharedJournals } from "../hooks/useSharedJournals";
import type { SharedJournal } from "../types";
import InviteCard from "./InviteCard";
import JournalCard from "./JournalCard";
import ManageDialog from "./ManageDialog";

const SECTION = "ap-sec mb-2.5";

function JournalList({ items, onManage }: { items: SharedJournal[]; onManage: (id: string) => void }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((j) => (
        <JournalCard key={j.id} journal={j} onManage={() => onManage(j.id)} />
      ))}
    </ul>
  );
}

/**
 * The collaboration page of the Journal: invitations waiting for you, the journals you own, and the journals others shared with you.
 * Writing in a journal happens on its own page; people, roles and invitations are managed in the dialog opened from a card.
 */
export default function CollaborationApp() {
  useCollaborationRealtime();
  const journalsQ = useSharedJournals();
  const invitesQ = useMyInvites();
  const [err, setErr] = useState("");
  const [managing, setManaging] = useState<string | null>(null);
  const [answering, setAnswering] = useState<string | null>(null);
  const act = useCollaborationActions(setErr);
  const { prompt, dialog } = usePrompt();

  const journals = journalsQ.data ?? [];
  const mine = journals.filter((j) => j.role === "owner");
  const shared = journals.filter((j) => j.role !== "owner");
  const invites = invitesQ.data ?? [];

  async function create() {
    setErr("");
    const name = await prompt({
      title: "New shared journal",
      body: "Give it a name you’ll both recognise. You can invite people once it exists.",
      label: "Journal name",
      placeholder: "Trip with Sam",
      confirmLabel: "Create",
      validate: (v) =>
        v.trim() ? (v.trim().length > LIMIT.nameMax ? `Use up to ${LIMIT.nameMax} characters.` : null) : "Give the journal a name.",
    });
    const created = name?.trim() ? await act.create(name.trim()) : undefined;
    if (created) setManaging(created.id);
  }

  async function answer(id: string, action: "accept" | "decline") {
    setErr("");
    setAnswering(id);
    await act.respond(id, action);
    setAnswering(null);
  }

  const loading = journalsQ.isPending || invitesQ.isPending;
  return (
    <div className="mx-auto w-full max-w-[1120px]">
      {dialog}
      {managing && <ManageDialog id={managing} onClose={() => setManaging(null)} />}

      <header className="mb-[18px] flex flex-col gap-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-serif text-[clamp(30px,3.4vw,42px)] leading-[1.04] font-normal tracking-[-0.03em] text-balance">
              Collaboration
            </h1>
            <p className="mt-1.5 text-[14px] text-fg-subtle">
              Write a journal together. Invite people by username; they join when they accept.
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={() => void create()}>
            <FA icon={faPlus} aria-hidden />
            <span>New journal</span>
          </button>
        </div>
      </header>

      {err && (
        <p className="form-err mb-3" role="alert">
          {err}
        </p>
      )}
      {(journalsQ.isError || invitesQ.isError) && (
        <p className="form-err mb-3" role="alert">
          Couldn’t load your shared journals.
        </p>
      )}

      {invites.length > 0 && (
        <section className="mb-6" aria-label="Invitations">
          <h2 className={SECTION}>Invitations · {invites.length}</h2>
          <ul className="flex flex-col gap-2.5">
            {invites.map((i) => (
              <InviteCard key={i.id} invite={i} busy={answering === i.id} onAnswer={(a) => void answer(i.id, a)} />
            ))}
          </ul>
        </section>
      )}

      {!loading && journals.length === 0 && (
        <p className="ap-none">No shared journals yet. Start one and invite someone by their username.</p>
      )}
      {mine.length > 0 && (
        <section className="mb-6" aria-label="Journals you own">
          <h2 className={SECTION}>Yours · {mine.length}</h2>
          <JournalList items={mine} onManage={setManaging} />
        </section>
      )}
      {shared.length > 0 && (
        <section className="mb-6" aria-label="Journals shared with you">
          <h2 className={SECTION}>Shared with you · {shared.length}</h2>
          <JournalList items={shared} onManage={setManaging} />
        </section>
      )}
    </div>
  );
}
