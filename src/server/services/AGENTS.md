# src/server/services

**Purpose:** The application's business logic. One folder per domain: `ai/`, `composio/`, `notes/`, `tasks/`, `calendar/`, `automation/` (and later `workspace/`, `journal/`, `email/`, `search/`, `notifications/`, `meetings/`, `billing/`).

## File layout per domain

```
services/<domain>/
  AGENTS.md            responsibilities, public functions, tables, Jira keys
  <domain>.service.ts  exported async functions (the public API of the domain)
  <domain>.schema.ts   Zod schemas for inputs/outputs shared with API routes
  errors.ts            domain errors (optional)
  <domain>.test.ts     unit/integration tests
```

## Rules

- Public functions: `async function createNote(ctx: Ctx, input: CreateNoteInput): Promise<Note>`.
- Permission check first (`can(ctx, "notes:create")`), then rules, then repository calls.
- Cross-domain calls go through the other domain's service, never its repository.
- Side effects (notifications, audit, usage metering) are explicit and testable; prefer emitting an event/job over inline work for slow things.
- Idempotency for anything triggered by webhooks, jobs or retries.
