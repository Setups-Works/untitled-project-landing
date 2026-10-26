"use client";
import { useState, useTransition } from "react";
import type { BillingPlan } from "@untitled/types";
import { priceLine } from "@untitled/logic/billing";
import { savePlan } from "../../app/admin/plans/actions";

/** Prices are typed in major units (9.50) and stored in the smallest unit (950); this is the only place that converts. */
const MINOR = 100;
const toMajor = (minor: number) => String(minor / MINOR);
const toMinor = (major: string) => Math.round(Number(major) * MINOR);

/** Inputs here need their own look: the base CSS does not reset form controls (border, font, background). */
const INPUT =
  "h-10 w-full rounded-r2 border-0 bg-surface-muted px-3 font-sans text-[14px] text-fg placeholder:text-fg-subtle focus:bg-surface";

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`grid content-start gap-1.5 ${className}`}>
      <span className="text-[12.5px] text-fg-subtle">{label}</span>
      {children}
    </label>
  );
}

function PlanForm({ plan }: { plan: BillingPlan }) {
  const [name, setName] = useState(plan.name);
  const [tagline, setTagline] = useState(plan.tagline);
  const [price, setPrice] = useState(toMajor(plan.price_cents));
  const [currency, setCurrency] = useState(plan.currency);
  const [interval, setInterval_] = useState(plan.interval);
  const [included, setIncluded] = useState(String(plan.included_tokens));
  const [rate, setRate] = useState(toMajor(plan.token_price_cents_per_million));
  const [features, setFeatures] = useState(plan.features.join("\n"));
  const [active, setActive] = useState(plan.active);
  const [sort, setSort] = useState(String(plan.sort));
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const shown = priceLine({
    ...plan,
    price_cents: toMinor(price) || 0,
    token_price_cents_per_million: toMinor(rate) || 0,
    interval,
    currency,
  });
  const numbersOk =
    [price, rate].every((v) => v !== "" && Number.isFinite(Number(v)) && Number(v) >= 0) &&
    Number.isInteger(Number(included)) &&
    Number(included) >= 0;

  return (
    <form
      className="liquid-flat grid gap-4 rounded-r3 p-5 [backdrop-filter:var(--glass-blur)] max-[700px]:p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await savePlan(plan.id, {
            name,
            tagline,
            price_cents: toMinor(price),
            currency,
            interval,
            included_tokens: Number(included),
            token_price_cents_per_million: toMinor(rate),
            features: features
              .split("\n")
              .map((f) => f.trim())
              .filter(Boolean),
            active,
            sort: Number(sort),
          });
          setNote(r.ok ? { ok: true, text: r.message ?? "Saved." } : { ok: false, text: r.error });
        });
      }}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="m-0 font-serif text-[26px] leading-none font-normal tracking-[-0.02em]">
          {plan.name} <small className="font-sans text-[12.5px] tracking-normal text-fg-subtle">({plan.id})</small>
        </h3>
        <span className="text-[13.5px] text-fg-muted">
          Shows as <b className="font-semibold text-fg">{shown}</b>
        </span>
      </header>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
        <Field label="Name" className="col-span-2 max-[500px]:col-span-1">
          <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </Field>
        <Field label="Order">
          <input className={INPUT} value={sort} onChange={(e) => setSort(e.target.value)} inputMode="numeric" />
        </Field>
        <label className="flex items-center gap-2.5 self-end pb-2.5 text-[14px] text-fg">
          <input type="checkbox" className="size-4 accent-green-fg" checked={active} onChange={(e) => setActive(e.target.checked)} />
          On offer
        </label>
      </div>

      <Field label="Tagline">
        <input
          className={INPUT}
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={200}
          placeholder="One line under the name"
        />
      </Field>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
        <Field label="Price">
          <input className={INPUT} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Currency">
          <input className={INPUT} value={currency} onChange={(e) => setCurrency(e.target.value.toLowerCase())} maxLength={3} />
        </Field>
        <Field label="Billed">
          <select className={INPUT} value={interval} onChange={(e) => setInterval_(e.target.value as BillingPlan["interval"])}>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
            <option value="none">No recurring fee</option>
          </select>
        </Field>
        <Field label="Tokens included">
          <input className={INPUT} value={included} onChange={(e) => setIncluded(e.target.value)} inputMode="numeric" />
        </Field>
        <Field label="Price per 1M tokens">
          <input className={INPUT} value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" />
        </Field>
      </div>

      <Field label="Features, one per line">
        <textarea
          className={`${INPUT} h-auto min-h-[104px] resize-y py-2.5 leading-relaxed`}
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          rows={4}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <small className="text-[13px] text-fg-subtle">Changes show on the pricing page and in Settings straight away.</small>
        <button className="btn btn-primary btn-sm" disabled={pending || !numbersOk || !name.trim()}>
          {pending ? "Saving…" : "Save plan"}
        </button>
      </div>
      {note && (
        <p className={note.ok ? "m-0 text-[13.5px] text-green-fg" : "form-err"} role={note.ok ? "status" : "alert"}>
          {note.text}
        </p>
      )}
    </form>
  );
}

export default function PlansEditor({ plans }: { plans: BillingPlan[] }) {
  return (
    <div className="grid gap-4">
      {plans.map((p) => (
        <PlanForm key={p.id} plan={p} />
      ))}
    </div>
  );
}
