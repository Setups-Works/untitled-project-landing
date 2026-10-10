# features/calendar

**Does:** Month, week, day, and agenda views of calendar events plus task due dates as a toggleable overlay; create, edit, and delete events. **Track B (UI) + C (service). Phase 3.**

**Components:**

- `CalendarApp.tsx`: Main coordinating container with keyboard shortcuts and responsive view switching.
- `CalendarHeader.tsx`: Date navigator, view switcher pills, task overlay toggle, and "+ New event" action.
- `MonthView.tsx`: 7-column month grid respecting `weekStart` ('mon' or 'sun'), showing event badges and task pills.
- `WeekView.tsx`: 7-column hourly time-grid with all-day row and current-time line.
- `DayView.tsx`: Single-day 24-hour detailed schedule view with all-day banner and location/notes.
- `AgendaView.tsx`: Chronological card list of upcoming events and tasks, optimized for mobile (375px width).
- `EventDialog.tsx`: Accessible Radix modal dialog for creating and editing events with color tints and all-day option.
- `ConnectCalendarBanner.tsx`: Connect prompt for Google Calendar integration via Composio.

**Backed by:** `calendar_events` table with Row-Level Security (`user_id = auth.uid()`), queried via `/api/v1/db`.

**Rules**

- Store UTC (`start_at`, `end_at`), render in the user's timezone; respect `weekStart` preference.
- Without a Google connection show a connect prompt, not an error.
- Mobile (< 640px) defaults to the Agenda view.
- Wrapped in `ClientOnly` on `/dashboard/calendar` to prevent hydration mismatches.

**Jira:** UNT-72 (service), UNT-73 (feature), UNT-76 (daily brief), UNT-82 (AI reads calendar).
