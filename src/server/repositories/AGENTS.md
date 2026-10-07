# src/server/repositories

**Purpose:** The only place that writes SQL queries for domain data. One file per aggregate: `notes.repository.ts`, `tasks.repository.ts`, `workspaces.repository.ts`, … **Owner:** track A. **Jira:** UNT-57.

## Rules

- Functions take a database handle (a `withUser` client by default so RLS applies) and plain arguments; return typed rows or `null`. They throw on database errors with context.
- **No business rules, no permission decisions, no calling other repositories' aggregates** — that's the service's job.
- Select only the columns you need; always `.limit()` lists; keep ordering stable for pagination.
- Map database rows (snake_case) to domain types in one place per repository.
- Service-role clients are passed in explicitly by a service that has already authorised the action; never create one inside a repository.
- New query = add an index if it filters/sorts on a new column (migration).
