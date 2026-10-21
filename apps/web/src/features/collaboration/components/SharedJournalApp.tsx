"use client";
import Link from "next/link";
import { canWrite, groupByDay, journalFilePath } from "@untitled/logic";
import { useMemo, useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { useConfirm } from "../../../components/ui/Confirm";
import { isoDate } from "../../../lib/dates";
import { safeName } from "../../../lib/notes";
import { fmtTime } from "../../../lib/prefs";
import { useCollaborationActions, useCollaborationRealtime, useJournalEntries, useSharedJournal } from "../hooks/useSharedJournals";
import { uploadAttachment, useSignedUrls } from "../hooks/useSignedUrls";
import EntryCard from "./EntryCard";
import EntryComposer from "./EntryComposer";
import ManageDialog from "./ManageDialog";
import PersonAvatar from "./PersonAvatar";
import RolePill from "./RolePill";

/** How many member badges to show before "+n". */
const AVATARS_SHOWN = 5;

const dayLabel = (iso: string, today: string) => {
  if (iso === today) return "Today";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
};

/** A shared journal: the feed everyone in it can read, and a box to write in it for owners and editors. */
export default function SharedJournalApp({ id }: { id: string }) {
  useCollaborationRealtime();
  const journalQ = useSharedJournal(id);
  const feedQ = useJournalEntries(id);
  const [err, setErr] = useState("");
  const [people, setPeople] = useState(false);
  const act = useCollaborationActions(setErr);
  const { ask, dialog } = useConfirm();
  const today = useMemo(() => isoDate(), []);

  const journal = journalQ.data;
  const entries = useMemo(() => feedQ.data?.pages.flatMap((p) => p.entries) ?? [], [feedQ.data]);
  const days = useMemo(() => groupByDay(entries), [entries]);
  const urls = useSignedUrls(entries.flatMap((e) => e.attachments.map((a) => a.path)));
  const writer = journal ? canWrite(journal.role) : false;
  const owner = journal?.role === "owner";

  async function send(body: string, files: File[]) {
    if (!journal) return false;
    setErr("");
    try {
      const attachments = await Promise.all(
        files.map((f) => uploadAttachment(journalFilePath(journal.me, id, crypto.randomUUID(), safeName(f.name)), f)),
      );
      const voiceOnly = !body && attachments.every((a) => a.type.startsWith("audio/"));
      return Boolean(await act.addEntry(id, { entry_date: today, body, kind: voiceOnly ? "voice" : "text", attachments }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn’t save that entry.");
      return false;
    }
  }

  async function remove(entryId: string, createdAt: string) {
    const yes = await ask({
      title: "Delete this entry?",
      body: <>The entry from {fmtTime(createdAt)} and its attachments will be permanently deleted for everyone.</>,
      confirmLabel: "Delete entry",
      danger: true,
    });
    if (yes) await act.removeEntry(id, entryId);
  }

  if (journalQ.isError)
    return (
      <div className="mx-auto w-full max-w-[940px]">
        <p className="ap-none">
          This journal doesn’t exist, or you’re not in it.{" "}
          <Link className="underline" href="/dashboard/journal/collaborate">
            Back to Collaboration
          </Link>
        </p>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-[940px]">
      {dialog}
      {people && <ManageDialog id={id} onClose={() => setPeople(false)} />}

      <section className="jr-main ap-card at-violet" aria-label={journal?.name ?? "Shared journal"}>
        <header className="jr-head">
          <Link
            href="/dashboard/journal/collaborate"
            className="mb-2 inline-flex items-center gap-1.5 text-[13px] text-fg-muted transition-colors hover:text-fg"
          >
            <FA icon={faArrowLeft} aria-hidden /> Collaboration
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="h3">{journal?.name ?? " "}</h1>
              <small>{journal ? `${journal.entry_count} ${journal.entry_count === 1 ? "entry" : "entries"}` : " "}</small>
            </div>
            {journal && (
              <div className="flex items-center gap-3 self-center">
                <RolePill role={journal.role} />
                {/* Not a <ul>: the card's global "ap-card ul" rule would stack the avatars in a column. */}
                <div className="flex items-center -space-x-2" role="group" aria-label={`${journal.members.length} people`}>
                  {journal.members.slice(0, AVATARS_SHOWN).map((m) => (
                    <span key={m.person.id} className="flex rounded-full ring-2 ring-white/80">
                      <PersonAvatar person={m.person} size="sm" />
                    </span>
                  ))}
                </div>
                {journal.members.length > AVATARS_SHOWN && (
                  <span className="text-[12.5px] text-fg-subtle">+{journal.members.length - AVATARS_SHOWN}</span>
                )}
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPeople(true)}>
                  <FA icon={faUserGroup} aria-hidden /> {owner ? "Manage" : "People"}
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="jr-list" aria-live="polite">
          {!feedQ.isPending && entries.length === 0 && (
            <p className="ap-none jr-empty">{writer ? "Nothing here yet. Write the first entry." : "Nothing here yet."}</p>
          )}
          {days.map((day) => (
            <section key={day.date} aria-label={dayLabel(day.date, today)}>
              <h2 className="ap-sec mt-5 mb-1">{dayLabel(day.date, today)}</h2>
              {day.entries.map((e) => {
                const mine = e.author.id === journal?.me;
                return (
                  <EntryCard
                    key={e.id}
                    entry={e}
                    urls={urls}
                    canEdit={mine && writer}
                    canDelete={(mine && writer) || owner}
                    onSave={async (body) => Boolean(await act.editEntry(id, e.id, { body }))}
                    onDelete={() => void remove(e.id, e.created_at)}
                  />
                );
              })}
            </section>
          ))}
          {feedQ.hasNextPage && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={feedQ.isFetchingNextPage}
                onClick={() => void feedQ.fetchNextPage()}
              >
                Show earlier days
              </button>
            </div>
          )}
        </div>

        {err && (
          <p className="form-err jr-err" role="alert">
            {err}
          </p>
        )}
        {writer ? (
          <EntryComposer onSend={send} />
        ) : (
          journal && (
            <p className="jr-compose text-[13.5px] text-fg-subtle">
              You can read this journal. Only editors and the owner can write in it.
            </p>
          )
        )}
      </section>
    </div>
  );
}
