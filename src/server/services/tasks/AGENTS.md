# services/tasks

**Owner:** track B (rules) with track A reviewing. **Phase 2.** **Jira:** UNT-61, UNT-65, UNT-91 (reminders), UNT-89 (automation triggers).

**Responsibilities:** CRUD for tasks and lists; complete/uncomplete; cancel/archive; reschedule; bulk operations; **recurrence** — completing a repeating task creates exactly one next task **atomically and idempotently** (use a transaction or an idempotency key; a double click must not create two).

**Rules**

- Pure date logic (`nextDue`, view membership, grouping) stays in `src/features/tasks/lib` (or a shared pure module) with unit tests; the service calls it.
- Emit task events (created/completed/overdue) for notifications and automations through the jobs/events mechanism, not inline.
- `list_id` must belong to the same workspace — the DB policy enforces it, the service should also check for a clear error.
