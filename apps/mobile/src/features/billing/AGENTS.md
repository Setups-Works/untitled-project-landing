# features/billing (app)

**Does:** Settings → **Plan and billing** in the phone app: your plan and where it stands, the plans on offer, your own API key for the Bring your own key plan, cancel / keep. Same API and rules as the web (`packages/api-client/src/billing.ts` → `/api/v1/billing/*`).

**Files:** `queries.ts` (TanStack Query over `createBillingApi(api)`) · `BillingSection.tsx` (Settings → Plan and billing, rendered by `features/settings/SettingsScreen.tsx`) · `PricingScreen.tsx` (the app's pricing page, route `/pricing` in `src/app/pricing.tsx`, a modal: plan cards, a comparison built from the plans, choose button) · `PlanCard.tsx` (one plan, shared by both).

**Entry points to the pricing screen:** a "Choose how you pay for AI" card on Home (only until a plan is chosen: the `plans` section of `features/home`) and the "Compare plans" button in Settings.

**Rules**

- Full design, rules and security: `docs/BILLING.md`. Nothing about plans is hard-coded: names, prices, allowances and feature lines come from the server (`MyBilling.plans`); format them with `priceLine`, `formatMoney`, `formatTokens` from `@untitled/logic`.
- The API key is write-only: never keep it after saving, never log it.
- While payments are not connected (`MyBilling.payments_connected` is false) the screen says nobody is charged.
