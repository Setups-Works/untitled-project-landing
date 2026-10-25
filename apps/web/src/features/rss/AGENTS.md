# features/rss

**Does:** the Reader (`/dashboard/workspace/reader`, behind the switcher on the Workspace page): follow feeds, read articles with title, description, picture and full text, search, filter (All / Unread / Starred), refresh, mark all read, unfollow. The layout and sidebar reuse the To-do classes (`tdo`, `tdo-sidewrap`, `tsb`, `tsb-item`): sand tint, icon rail when closed (remembered), drawer on phones. Views (All / Unread / Starred) and "My feeds" are in the sidebar. Adding accepts a feed address or a website (the feed it advertises is found). **Mobile:** `apps/mobile/src/features/rss` (Workspace tab → Reader), same API.

**Data flow:** `components → queries.ts → packages/api-client/src/rss.ts → /api/v1/rss/* → services/rss → repositories/rss.repository.ts → rss_feeds / rss_items` (RLS: owner only). Realtime refreshes open tabs. An open Reader refreshes itself every `RSS.autoRefreshMs`.

**Rules**

- Every limit and option lives in `packages/logic/src/rss.ts` (`RSS`, `RSS_FILTERS`), shared with the phone app. Never copy a number.
- Feed addresses are untrusted: only `services/rss/safeFetch.ts` may fetch them (http(s) only, private addresses refused at connect time, size and time capped). Never `fetch` a feed URL elsewhere.
- Articles are stored as plain text (`parse.ts` strips HTML); never render feed HTML.
- The refresh query key sits outside `qk.rss.all` on purpose, so a data change does not trigger another network refresh.
- Feature flag: `FEATURES.rssReader`.
- Form controls here need `border-0` and `font-sans` (the base CSS does not reset them).
