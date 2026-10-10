# features/calendar

**Does:** Month, week, day, and agenda views of calendar events plus task due dates as a toggleable overlay; create, edit, and delete events. **Track B (UI) + C (service). Phase 3.**

**Design:** follows `docs/DESIGN_LANGUAGE.md` (glass cards, serif title, `at-<tint>` + `tint` chips, pill buttons). Read it before changing any UI here.

**Files:**

- `components/CalendarApp.tsx`: container; keyboard shortcuts (`t m w d a c/n ← →`), delete confirmation (`useConfirm`), view switching.
- `components/CalendarHeader.tsx`: serif title, prev/today/next, view `Tabs`, Tasks toggle, "New event".
- `components/MonthView.tsx`, `TimeGrid.tsx` (Week = 7 days, Day = 1 day), `AgendaView.tsx`: the views. `Chips.tsx`: event and task chips.
- `components/EventDialog.tsx`: `Modal` + the to-do form's `tf-*` look; dates via `JournalCalendar`, times via `tf-pill` selects. Mounted only while open.
- `components/ConnectCalendarBanner.tsx`: Google connect prompt (dismissal remembered in localStorage).
- `queries.ts`: TanStack Query hooks (`useCalendarEvents`, `useCalendarActions`), optimistic with rollback. `useCalendar.ts`: view state + realtime on top of them. Tasks come from `useTasks()`.
- `utils.ts`: pure helpers (day grouping, overlap layout, draft ⇄ row, titles) — unit-tested in `tests/unit/calendar-utils.test.ts`.

**Rules**

- Store UTC (`start_at`, `end_at`), render in the user's timezone; respect `weekStart` preference.
- Without a Google connection show a connect prompt, not an error.
- Mobile (< 640px) defaults to the Agenda view.
- Wrapped in `ClientOnly` on `/dashboard/calendar` to prevent hydration mismatches.

**Jira:** UNT-72 (service), UNT-73 (feature), UNT-76 (daily brief), UNT-82 (AI reads calendar).
