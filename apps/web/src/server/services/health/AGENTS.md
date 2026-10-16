# services/health

**Purpose:** Daily health aggregates (steps, distance, active calories, heart rate, sleep) that the mobile app reads from Apple Health / Android Health Connect and the web Health page shows.

- `getHealth(userId, days)` · `syncHealth(userId, input)` — the only public functions. Reads and writes run as the user (RLS).
- Table: `health_daily` (owner only, one row per user per day). Never store raw samples; never log values.
- Web is read-only; only the phone writes, through `PUT /api/v1/health`. "Not set up" = no rows.
