# services/billing

**Does:** the rules for plans, usage and AI access. Public functions: `getMyBilling`, `choosePlan`, `cancelPlan`, `resumePlan`, `saveByoKey`, `removeByoKey`, `aiAccessFor`, `listPublicPlans`, and the admin-only `adminOverview`, `adminUpdatePlan`, `adminSetUserPlan`.

**Files:** `billing.service.ts` (rules), `billing.schema.ts` (Zod for the routes and the admin form), `keyVault.ts` (AES-256-GCM for saved API keys). SQL is in `repositories/billing.repository.ts`.

**Rules**

- Full description: `docs/BILLING.md`.
- Callers: API routes under `app/api/v1/billing` (a person acting on themselves), the two AI services (`aiAccessFor` + `record`), and `app/admin/plans/actions.ts` (the `admin*` functions, **only** after `assertAdmin()`).
- Writes to `user_billing`, `ai_usage`, `user_ai_keys` and `billing_plans` use the owner connection on purpose (people cannot write these tables). Always act on the `userId` from the session, never from the request body.
- Every AI call goes through `aiAccessFor()` first. A new AI entry point without it is a bug.
- Never log or return a key, a prompt or an answer. Never build a provider URL from user input.
- A period that has ended is settled lazily in `settled()`; keep reads cheap and idempotent.
- Change a rule → update `tests/db/billing.test.ts` and `docs/BILLING.md`.
