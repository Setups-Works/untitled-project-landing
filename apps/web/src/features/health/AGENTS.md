# features/health

**Does:** the Health page (`/dashboard/health`): a Today / Yesterday / 7 days / 30 days filter, a steps ring (with per-day bars for the multi-day ranges) and tiles for steps, sleep, distance, active energy, heart rate and resting heart rate, summarised for the chosen range. Three actions (Ask the assistant, Add to journal, Save as note) open the chat with a ready message (`/dashboard/chat?ask=…`); the assistant answers or drafts the entry, and nothing is saved until the person confirms in the chat. Each tile opens `/dashboard/health/[metric]` (`MetricDetail`): a per-day chart with the goal, average / best / lowest, every day listed, and an "Ask the assistant" action. With no data it shows the setup steps (open the phone app, allow Apple Health / Health Connect, sync). **Read-only on the web.**

**Data flow:** the phone app reads Apple Health (HealthKit) or Android Health Connect, then `PUT /api/v1/health` (service `server/services/health`, table `health_daily`). This page reads `health_daily` through `/api/v1/db` and refreshes on realtime. The chat assistant gets the last 30 days from `healthContextFor(userId, localDate)` in a delimited `<health-data>` block, with today and yesterday marked (prompt `chat.v9`).

**Rules**

- The range filter, summaries and chat messages (`daysInRange`, `summarizeHealth`, `healthPrompt`) and the detail data (`HEALTH_METRICS`, `metricSeries`, `metricPrompt`) are in `@untitled/logic`, shared with the phone app.
- Goals, windows and formatters come from `@untitled/logic` (`packages/logic/src/health.ts`), shared with the phone app. Never copy them.
- Only daily aggregates are stored, never raw samples. Never log values.
- "Not set up" means no rows. The web cannot know the phone's permission state; the phone screen handles that.
- Mobile: `apps/mobile/src/features/health` (`source.ios.ts` HealthKit, `source.android.ts` Health Connect). Needs a development build, not Expo Go.

**Links:** `/dashboard/health?d=YYYY-MM-DD` opens the page on that day (the app: `/health?d=…`). Notes the assistant writes about health end with `[Open in Health](…)`; the shared Markdown parser (`packages/logic/src/markdown.ts`) accepts only this path (and `/dashboard/health`) besides to-do, note and journal links, and both apps turn it into a tap.
