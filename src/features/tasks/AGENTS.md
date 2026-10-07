# features/tasks

**Does:** To-do app: Inbox, Today, Upcoming (week strip), Filters (cancelled/overdue/recurring/archived), Completed, lists, priorities P1–P4, recurrence, list/board/calendar layouts, view options, quick add, search, keyboard shortcuts, bulk actions. **Track B. Phase 2.**

**Today (legacy):** `components/app/todo/*` (`TodoApp`, `Views`, `TaskForm`, `TaskItem`, `Sidebar`, `ViewOptions`, `TaskDialog`, `ShortcutsDialog`), `lib/tasks.ts` (view rules, sorting, grouping, `nextDue`).

**Backed by:** `tasks`, `task_lists`. Target: `src/server/services/tasks` + repository + `/api/v1/tasks`, `/api/v1/task-lists`.

**Rules**
- Completing a recurring task must create **exactly one** next task, atomically (today done in the client — move into the service with a transaction/idempotency key).
- Dates are `date` strings in the user's local calendar; never convert through UTC for due dates.
- View membership logic lives in `lib/tasks.ts` (`inView`) — keep it pure and unit-tested.
- Shortcuts only fire when not typing and no dialog is open.

**Jira:** UNT-61 (migrate), UNT-65 (subtasks, labels, reminders, board DnD), UNT-91 (reminder notifications), UNT-89 (automations).
