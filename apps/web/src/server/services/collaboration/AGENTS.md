# services/collaboration

**Purpose:** shared journals: journals, people, invitations and entries. **Owner:** track B. Reference for permission-heavy services.

- Public functions (`collaboration.service.ts`): `listJournals` · `getJournal` · `createJournal` · `renameJournal` · `deleteJournal` · `inviteByUsername` · `inviteByEmail` · `cancelInvite` · `listMyInvites` · `respondToInvite` · `changeRole` · `removeMember` · `listEntries` · `addEntry` · `editEntry` · `removeEntry` · `mayUseJournalFile`. Inputs are validated by `collaboration.schema.ts`; limits come from `SHARED_JOURNAL` in `@untitled/logic`.
- Errors are the typed ones in `server/errors.ts` (`NotFoundError`, `ForbiddenError`, `ValidationError`, `ConflictError`, `RateLimitError`); `server/api/handler.ts` maps them to HTTP. A stranger always gets **not found**, never a hint the journal exists.
- Tables: `shared_journals`, `shared_journal_members`, `shared_journal_invites`, `shared_journal_entries`. SQL lives in `repositories/collaboration.repository.ts`.

**Rules**

- Reads and writes run **as the user** (`withUser`), so row-level security decides. `withOwner` is used in exactly two places, after the service has authorised the action: looking people up by username/id (the account tables are closed to signed-in users) and creating/answering an invitation (an invitee can't read a journal they haven't joined, and a membership may only appear when an invitation is accepted).
- Invitations go out by username or email (`POST …/invites` takes either in `username`). Both send the invitee a notification email (best effort). `inviteByEmail` answers the same whether or not the address has an account (`id: null`), so it can't be used to discover accounts; an address with no account gets no email, and the owner can invite them by username after they sign up.
- Never return an email address; people are `{ id, username, name, image }`.
- Inviting is rate limited (`SHARED_JOURNAL.invitesPerHour`) and a journal holds at most `SHARED_JOURNAL.maxPeople` (members + open invitations).
- Attached files live under `<author>/shared-journal/<journal>/`; `mayUseJournalFile` is what lets members of a journal read each other's files and only authors upload into their own folder.
- Tests: `apps/web/tests/unit/collaboration-schema.test.ts` (inputs), `apps/web/tests/db/shared-journals.test.ts` (invitations, roles and RLS against real Postgres), `packages/logic/src/sharedJournals.test.ts` (helpers).
