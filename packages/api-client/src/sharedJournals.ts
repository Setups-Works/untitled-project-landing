import type {
  SharedJournal,
  SharedJournalDetail,
  SharedJournalEntry,
  SharedJournalInvite,
  SharedJournalInviteRole,
  Attachment,
} from "@untitled/types";

/**
 * The shared-journal API, written once for the web and the Expo app. Each app passes its own small HTTP adapter (cookies and
 * errors differ per platform); the adapter returns the response body and throws on a failed request. Routes: apps/web/src/app/api/v1/shared-journals.
 */
export type Http = {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
};

type Data<T> = { data: T };
export type EntryInput = { entry_date: string; body: string; kind?: "text" | "voice"; attachments?: Attachment[] };
export type EntriesPage = { entries: SharedJournalEntry[]; more: boolean };

const base = "/api/v1/shared-journals";

export function createSharedJournalsApi(http: Http) {
  const unwrap = async <T>(p: Promise<Data<T>>) => (await p).data;
  return {
    list: () => unwrap(http.get<Data<SharedJournal[]>>(base)),
    get: (id: string) => unwrap(http.get<Data<SharedJournalDetail>>(`${base}/${id}`)),
    create: (name: string) => unwrap(http.post<Data<SharedJournalDetail>>(base, { name })),
    rename: (id: string, name: string) => unwrap(http.patch<Data<SharedJournalDetail>>(`${base}/${id}`, { name })),
    remove: (id: string) => unwrap(http.delete<Data<null>>(`${base}/${id}`)),

    invite: (id: string, username: string, role: SharedJournalInviteRole) =>
      unwrap(http.post<Data<{ id: string }>>(`${base}/${id}/invites`, { username, role })),
    cancelInvite: (id: string, inviteId: string) => unwrap(http.delete<Data<null>>(`${base}/${id}/invites/${inviteId}`)),
    myInvites: () => unwrap(http.get<Data<SharedJournalInvite[]>>("/api/v1/shared-journal-invites")),
    respond: (inviteId: string, action: "accept" | "decline") =>
      unwrap(http.post<Data<{ journalId: string }>>(`/api/v1/shared-journal-invites/${inviteId}`, { action })),

    setRole: (id: string, userId: string, role: SharedJournalInviteRole) =>
      unwrap(http.patch<Data<null>>(`${base}/${id}/members/${userId}`, { role })),
    /** The owner removes someone; a member leaves by passing their own id. */
    removeMember: (id: string, userId: string) => unwrap(http.delete<Data<null>>(`${base}/${id}/members/${userId}`)),

    entries: (id: string, cursor?: string) =>
      unwrap(http.get<Data<EntriesPage>>(`${base}/${id}/entries${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`)),
    addEntry: (id: string, entry: EntryInput) => unwrap(http.post<Data<SharedJournalEntry>>(`${base}/${id}/entries`, entry)),
    editEntry: (id: string, entryId: string, patch: { body?: string; attachments?: Attachment[] }) =>
      unwrap(http.patch<Data<SharedJournalEntry>>(`${base}/${id}/entries/${entryId}`, patch)),
    removeEntry: (id: string, entryId: string) => unwrap(http.delete<Data<null>>(`${base}/${id}/entries/${entryId}`)),
  };
}

export type SharedJournalsApi = ReturnType<typeof createSharedJournalsApi>;
