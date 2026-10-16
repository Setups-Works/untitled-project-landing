# features/health

**Does:** the Health page (`/dashboard/health`): a weekly steps ring and tiles for steps, sleep, distance, active energy, heart rate and resting heart rate, newest synced day. With no data it shows the setup steps (open the phone app, allow Apple Health / Health Connect, sync). **Read-only on the web.**

**Data flow:** the phone app reads Apple Health (HealthKit) or Android Health Connect, then `PUT /api/v1/health` (service `server/services/health`, table `health_daily`). This page reads `health_daily` through `/api/v1/db` and refreshes on realtime. The chat assistant gets the last 7 days from `healthContextFor()` in a delimited `<health-data>` block (prompt `chat.v8`).

**Rules**

- Goals, windows and formatters come from `@untitled/logic` (`packages/logic/src/health.ts`), shared with the phone app. Never copy them.
- Only daily aggregates are stored, never raw samples. Never log values.
- "Not set up" means no rows. The web cannot know the phone's permission state; the phone screen handles that.
- Mobile: `apps/mobile/src/features/health` (`source.ios.ts` HealthKit, `source.android.ts` Health Connect). Needs a development build, not Expo Go.
