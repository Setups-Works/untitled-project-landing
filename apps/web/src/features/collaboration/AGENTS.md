# features/collaboration

**Does:** shared journals. Named journals that several people read and write together: create one, invite people **by username**, they accept or decline, owners manage roles, everyone writes entries (text and files). The Journal page links to a separate **Collaboration** page that manages all of it. **Track B. Reference for multi-person features.**

**Design:** follows `docs/DESIGN_LANGUAGE.md` (glass `ap-card at-<tint>`, serif titles, `btn`, `tf-pill`, `at-<tint> tint` pills). The feed reuses the Journal's own `jr-*` look so the two read as one product. No literal colours, sizes or limits: tints come from `ROLE_TONE` / `toneFor`, limits from `SHARED_JOURNAL` (both in `@untitled/logic`).

**Roles:** `owner` manages people and can delete the journal or any entry · `editor` writes entries and edits/deletes their own · `viewer` reads only. Enforced by row-level security; the UI only hides what the server would refuse.

**Files:**

- `components/CollaborationApp.tsx`: the page (`/dashboard/journal/collaborate`): invitations, journals you own, journals shared with you.
- `components/SharedJournalApp.tsx`: one journal's feed + composer (`/dashboard/journal/shared/[id]`), `EntryCard`, `EntryComposer`.
- `components/ManageDialog.tsx` (+ `PeopleList`, `InviteForm`): people, roles, invitations, rename, leave/delete in one `Modal`.
- `components/{JournalCard,InviteCard,PersonAvatar,RolePill,RoleSelect}.tsx`: small presentational pieces.
- `hooks/useSharedJournals.ts`: TanStack Query hooks and one `useCollaborationActions`; realtime via `useCollaborationRealtime`. `hooks/useSignedUrls.ts`: links for attached files.
- `index.ts`: the public surface (`CollaborationApp`, `SharedJournalApp`, `useMyInvites`, types). Other code imports only from here.

**Shared with the app:** the API calls live in `packages/api-client/src/sharedJournals.ts`, pure helpers and limits in `packages/logic/src/sharedJournals.ts`, types in `packages/types`. The app (`apps/mobile/src/features/collaboration`) uses the same code.

**Backed by:** `shared_journals`, `shared_journal_members`, `shared_journal_invites`, `shared_journal_entries` (see `docs/DATA_MODEL.md`); service `server/services/collaboration`; routes `/api/v1/shared-journals/**` and `/api/v1/shared-journal-invites/**`; files in `note-files` under `<author>/shared-journal/<journal>/`.

**Rules**

- A shared journal is **separate from the private `journal_entries`** on purpose: personal views, AI context, insights and exports must never contain other people's words. Never merge the two queries.
- Changes are applied after the server answers (no optimistic updates): outcomes depend on permissions.
- Dates print only inside `ClientOnly` (the page files wrap it).
- Gated by `FEATURES.sharedJournals`.
