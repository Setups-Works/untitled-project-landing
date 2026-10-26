"use client";
import { useState } from "react";
import { FontAwesomeIcon as FA } from "@fortawesome/react-fontawesome";
import { faCheck, faKey } from "@fortawesome/free-solid-svg-icons";
import type { BillingPlan, MyBilling } from "@untitled/types";
import { BYO_PROVIDERS, byoProvider, formatMoney, formatTokens, priceLine } from "@untitled/logic/billing";
import { useConfirm } from "../../components/ui/Confirm";
import { useBilling, useBillingActions } from "./queries";

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

/** One line about where the current plan stands: when it renews or ends, or what this period has used. */
function standing(b: MyBilling): string {
  if (!b.plan)
    return b.status === "canceled"
      ? "Your last plan has ended. Choose a plan below to start again."
      : "You haven’t chosen a plan yet. AI works as it always has until you do.";
  if (b.plan.id === "subscription" && b.period_end)
    return b.cancel_at_period_end ? `Cancels on ${day(b.period_end)}. You keep everything until then.` : `Renews on ${day(b.period_end)}.`;
  if (b.plan.id === "payg")
    return `${formatTokens(b.tokens_used)} tokens used this period${b.cost_cents > 0 ? `, about ${formatMoney(b.cost_cents, b.plan.currency)}` : ""}.`;
  return b.byo.hint ? "Your own key is saved." : "Add your API key to start using AI.";
}

function KeyForm({ billing, onError }: { billing: MyBilling; onError: (m: string) => void }) {
  const { saveKey, removeKey } = useBillingActions(onError);
  const { ask, dialog } = useConfirm();
  const [provider, setProvider] = useState<string>(billing.byo.provider ?? BYO_PROVIDERS[0].id);
  const [model, setModel] = useState(billing.byo.model ?? BYO_PROVIDERS[0].model);
  const [apiKey, setApiKey] = useState("");
  const saved = billing.byo.hint;

  return (
    <div className="mt-5 rounded-r3 bg-surface-muted p-4">
      {dialog}
      <div className="mb-3 flex items-center gap-2.5 text-[14.5px] font-semibold">
        <FA icon={faKey} className="text-[13px] text-fg-muted" /> Your AI provider
      </div>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!apiKey.trim()) return;
          saveKey.mutate({ provider, model: model.trim(), apiKey: apiKey.trim() }, { onSuccess: () => setApiKey("") });
        }}
      >
        <label className="st-field">
          <span>Provider</span>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setModel(byoProvider(e.target.value)?.model ?? model);
            }}
          >
            {BYO_PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="st-field">
          <span>Model</span>
          <input value={model} onChange={(e) => setModel(e.target.value)} maxLength={100} autoComplete="off" spellCheck={false} />
        </label>
        <label className="st-field">
          <span>API key {saved ? `(saved, ending ${saved})` : ""}</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={saved ? "Enter a new key to replace it" : "Paste your key"}
            autoComplete="off"
            spellCheck={false}
            maxLength={400}
          />
        </label>
        <small className="text-[12.5px] text-fg-subtle">
          Your key is stored encrypted and only used to answer your own requests. It is never shown again.
        </small>
        <div className="st-actions">
          <button className="btn btn-primary btn-sm" disabled={!apiKey.trim() || !model.trim() || saveKey.isPending}>
            {saved ? "Replace key" : "Save key"}
          </button>
          {saved && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={async () => {
                if (
                  await ask({
                    title: "Remove your API key?",
                    body: "AI stops working on this plan until you add a key again.",
                    confirmLabel: "Remove key",
                    danger: true,
                  })
                )
                  removeKey.mutate();
              }}
            >
              Remove key
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function PlanCard({ plan, current, busy, onChoose }: { plan: BillingPlan; current: boolean; busy: boolean; onChoose: () => void }) {
  return (
    <article
      className="liquid-flat flex flex-col gap-3 rounded-r3 p-[18px] [backdrop-filter:var(--glass-blur)]"
      data-current={current}
      aria-label={plan.name}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="m-0 text-[15px] font-semibold">{plan.name}</h3>
        {current && (
          <span className="rounded-pill bg-fill-dark px-2.5 py-1 text-[11px] font-semibold tracking-[0.06em] text-on-dark uppercase">
            Current
          </span>
        )}
      </div>
      <div className="font-serif text-[26px] leading-none tracking-[-0.02em]">{priceLine(plan)}</div>
      <p className="m-0 text-[13.5px] text-fg-muted">{plan.tagline}</p>
      {plan.id === "subscription" && plan.included_tokens > 0 && (
        <p className="m-0 text-[13px] text-fg-subtle">{formatTokens(plan.included_tokens)} AI tokens included each month</p>
      )}
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13.5px]">
            <FA icon={faCheck} className="mt-1 text-[11px] text-green-fg" />
            {f}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-1">
        <button className={`btn btn-sm ${current ? "btn-secondary" : "btn-primary"}`} disabled={current || busy} onClick={onChoose}>
          {current ? "Your plan" : "Choose this plan"}
        </button>
      </div>
    </article>
  );
}

/** Settings → Plan and billing: where you stand, the three plans, your own key, and cancelling. */
export default function BillingPanel() {
  const [err, setErr] = useState("");
  const q = useBilling();
  const { choose, cancel, resume } = useBillingActions(setErr);
  const { ask, dialog } = useConfirm();
  const b = q.data;

  if (q.isError)
    return (
      <p className="form-err" role="alert">
        Couldn’t load your plan. Try again in a moment.
      </p>
    );
  if (!b) return <p className="ap-none">Loading your plan…</p>;

  const busy = choose.isPending || cancel.isPending || resume.isPending;
  const allowance = b.plan?.id === "subscription" ? b.plan.included_tokens : 0;
  const used = allowance > 0 ? Math.min(100, Math.round((b.tokens_used / allowance) * 100)) : 0;

  return (
    <div className="st-body">
      {dialog}
      {err && (
        <p className="form-err" role="alert">
          {err}
        </p>
      )}
      <div>
        <b className="text-[15px]">{b.plan ? b.plan.name : "No plan chosen"}</b>
        <p className="m-0 mt-1 text-[13.5px] text-fg-muted">{standing(b)}</p>
        {allowance > 0 && (
          <div className="mt-3">
            <div
              className="h-1.5 overflow-hidden rounded-pill bg-line"
              role="progressbar"
              aria-label="AI allowance used"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={used}
            >
              <i className="block h-full rounded-pill bg-green-fg" style={{ width: `${used}%` }} />
            </div>
            <small className="mt-1 block text-[12.5px] text-fg-subtle">
              {formatTokens(b.tokens_used)} of {formatTokens(allowance)} tokens used this period
            </small>
          </div>
        )}
      </div>
      {!b.payments_connected && (
        <p className="m-0 rounded-r2 bg-surface-muted px-3.5 py-2.5 text-[13px] text-fg-muted">
          Payments aren’t connected yet, so choosing or changing a plan doesn’t charge you.
        </p>
      )}

      <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
        {b.plans.map((p) => (
          <PlanCard key={p.id} plan={p} current={b.plan?.id === p.id} busy={busy} onChoose={() => choose.mutate(p.id)} />
        ))}
      </div>

      {b.plan?.id === "byo" && <KeyForm billing={b} onError={setErr} />}

      {b.plan && (
        <div className="st-actions">
          {b.cancel_at_period_end ? (
            <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => resume.mutate()}>
              Keep my plan
            </button>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              disabled={busy}
              onClick={async () => {
                const ends = b.plan?.id === "subscription" && b.period_end ? `It ends on ${day(b.period_end)}.` : "It stops right away.";
                if (
                  await ask({
                    title: `Cancel ${b.plan?.name}?`,
                    body: `${ends} You can choose a plan again whenever you like.`,
                    confirmLabel: "Cancel plan",
                    danger: true,
                  })
                )
                  cancel.mutate();
              }}
            >
              Cancel plan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
