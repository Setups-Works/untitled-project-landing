# features/billing

**Does:** Settings → **Plan and billing**: where you stand (plan, renewal or end date, this period's AI use), the plans on offer, your own API key for the Bring your own key plan, and cancel / keep. Same screen in the phone app: `apps/mobile/src/features/billing`.

**Data flow:** `BillingPanel.tsx → queries.ts → packages/api-client/src/billing.ts → /api/v1/billing/* → services/billing → repositories/billing.repository.ts`. Every change answers with the fresh `MyBilling`, which `queries.ts` writes into the cache (`qk.billing.me`).

**Rules**

- Full design, rules and security notes: `docs/BILLING.md`. Read it before changing behaviour.
- No prices, allowances, names or feature lines in components: they come from `MyBilling.plans` (edited in Admin → Plans). Format with `priceLine`, `formatMoney`, `formatTokens` from `@untitled/logic/billing`.
- The API key is write-only: the UI shows the last four characters the server returns and never holds the key after saving.
- Cancelling and removing a key use `useConfirm()`.
- While `FEATURES.payments` is off, the panel says nobody is charged; keep that note in sync when payments go live.
- Form controls need `border-0` / `font-sans`; reuse `st-field`, `st-body`, `st-actions`.
