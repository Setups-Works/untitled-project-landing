# services/notes — the reference implementation

**Owner:** track A builds the pattern, track B migrates the feature. **Phase 1–2.** **Jira:** UNT-57 (pattern), UNT-60 (migration), UNT-64 (v2), UNT-67 (attachments).

**Responsibilities:** list/search/create/update/delete notes, pin and categorise, reorder (`sort_order`), manage attachments, expose history (`note_versions`), enforce workspace permissions, later tags/backlinks/trash.

**This folder defines the pattern every other domain copies** — keep it exemplary:

1. `notes.schema.ts` — Zod input/output types.
2. `notes.service.ts` — functions taking `ctx` + input; permission check → rules → repository.
3. `src/server/repositories/notes.repository.ts` — queries only.
4. `src/app/api/v1/notes/route.ts` — built with the shared `handler()`; calls the service.
5. `src/features/notes` — hooks call the API; components never touch the database.
6. Tests for rules (ownership, validation, ordering).

**Rules:** the note body is markdown (store as given, sanitise on render); never trust `user_id`/`workspace_id` from the client — take them from `ctx`.
