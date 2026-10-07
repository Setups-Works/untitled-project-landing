# features/journal

**Does:** many timestamped entries per day, day navigation + month calendar (dots on days with entries), composer with attachments and voice, edit/delete entries. **Track B. Phase 2.**

**Today (legacy):** `components/app/{JournalView,JournalCalendar}.tsx`, `useRecorder.ts`.

**Backed by:** `journal_entries`, bucket `note-files` (`<uid>/journal/<entry>/…`). **Private to the author** — must stay so even inside shared workspaces.

**Rules**
- `entry_date` is the user's local calendar day (`date`), `created_at` the real timestamp; show times with `fmtTime()` (respects 12/24 h).
- Week start comes from user preferences (`weekdayIndex`).
- `?d=YYYY-MM-DD` deep-links a day (used by universal search).

**Jira:** UNT-62 (migrate), UNT-66 (templates, prompts, mood, weekly review), UNT-69/93 (insights).
