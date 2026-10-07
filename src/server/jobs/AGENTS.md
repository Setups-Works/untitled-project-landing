# src/server/jobs

**Purpose:** Background work: calendar/email sync, meeting transcription, automation runs, reminders, digests, embeddings indexing, orphan cleanup. **Owner:** track A builds the runner (UNT-59); track C/B add jobs.

## How it works (target)

- Vercel Cron (and internal enqueue) calls `/api/v1/jobs/<name>` with `CRON_SECRET`.
- A job is a function registered in `jobs/registry.ts`: `{ name, run(ctx) }`. State lives in the `jobs` table (status, attempts, last_error, run_at, locked_until) so a job never runs twice at once.
- Retries use exponential backoff with a max attempts; failures are recorded and visible to admins (UNT-97).

## Rules

- Jobs are **idempotent** and **short** (split big work into batches; Vercel functions have time limits).
- Authenticate the route before doing anything; never accept user input as the job's authority.
- Call services — jobs contain orchestration, not business rules.
- Log ids and counts only, never content.
