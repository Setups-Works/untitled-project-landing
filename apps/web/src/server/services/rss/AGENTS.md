# services/rss

Feeds and articles for the Reader. `rss.service.ts` (add, remove, refresh, list, read/star), `parse.ts` (RSS 2.0, RSS 1.0 and Atom → plain text), `safeFetch.ts` (SSRF-safe fetch), `rss.schema.ts` (Zod), repository `server/repositories/rss.repository.ts`. Routes: `app/api/v1/rss/*`. Tables: `rss_feeds`, `rss_items` (migration `20261025120000_rss_reader.sql`). Limits and rate limits come from `RSS` in `@untitled/logic`. Tests: `apps/web/tests/unit/rss-parse.test.ts`.
