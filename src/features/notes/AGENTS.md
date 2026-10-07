# features/notes

**Does:** colour-coded note cards (masonry, drag to reorder, pin, categories), markdown editor with toolbar, slash commands, find, voice dictation, attachments, version history, quick-capture bar. **Track B. Phase 2.**

**Today (legacy):** `components/app/{NotesView,NoteEditor,Markdown,Menu}.tsx`, `lib/notes.ts`, `components/app/useRecorder.ts`.

**Backed by:** `notes`, `note_versions` (trigger-written), bucket `note-files`. Target: `src/server/services/notes` + `repositories/notes.repository.ts` + `/api/v1/notes`.

**Rules**
- Content is markdown rendered with our safe renderer — never `dangerouslySetInnerHTML`.
- Autosave is debounced; never lose text on failure (keep local state, show "Couldn't save").
- Reorder uses `sort_order` midpoints — don't renumber everything.
- Attachments go through the shared attachments service (UNT-67) once it exists.

**Jira:** UNT-57 (reference service), UNT-60 (migrate), UNT-64 (tags/backlinks/trash), UNT-85 (AI actions), UNT-63 (search).
