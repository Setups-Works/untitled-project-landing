# src/app/admin — admin panel

**Purpose:** Operate the product: users, usage, announcements, audit log (built) and workspaces, AI, integrations, analytics, logs, settings (planned). **Owner:** track A. **Jira:** UNT-58, UNT-95, UNT-96, UNT-97, UNT-35.

## Today

| Route | Page | Data |
| --- | --- | --- |
| `/admin` | Overview stats and charts | auth admin API, row counts, `profiles` |
| `/admin/users` | Search/filter/sort/page, CSV, invite, detail drawer | `components/admin/UsersTable.tsx`, actions in `actions.ts` |
| `/admin/usage` | Item counts per user (ids only) | scans tables (to move into SQL: UNT-35) |
| `/admin/announcements` | Banners for all users | `announcements` |
| `/admin/audit` | Admin action log | `admin_audit` |

Add a section: create `app/admin/<section>/page.tsx` and one line in `components/admin/AdminNav.tsx`.

## Rules (security-critical)

- `layout.tsx` calls `requireAdmin()` for every page; every server action in `actions.ts` calls `assertAdmin()` first. **Never skip either.**
- Admin code uses the service role (`supabaseAdmin()` from `src/lib/supabase/admin.ts`) — keep that usage inside this folder and `src/server`.
- **Admins must not see user content** (notes, journal, chat text). Show counts and metadata only.
- Every state-changing action writes to `admin_audit` via `audit()`.
- Protect against self-harm: no demote/ban/delete of yourself or `ADMIN_EMAILS` accounts (see `guard()`).
- Destructive buttons use `useConfirm()`; show friendly errors.
