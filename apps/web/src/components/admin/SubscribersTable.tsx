"use client";
import { useState, useTransition } from "react";
import type { BillingPlan, PlanId } from "@untitled/types";
import { formatTokens } from "@untitled/logic/billing";
import type { SubscriberRow } from "../../server/repositories/billing.repository";
import { setUserPlan } from "../../app/admin/plans/actions";

/** Who is on which plan, with 30 days of token use. An admin can move a person to another plan or off all plans. Counts only, never content. */
export default function SubscribersTable({ rows, plans }: { rows: SubscriberRow[]; plans: BillingPlan[] }) {
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const change = (userId: string, value: string) =>
    start(async () => {
      setErr("");
      const r = await setUserPlan(userId, value === "" ? null : (value as PlanId));
      if (!r.ok) setErr(r.error);
    });

  return (
    <>
      {err && (
        <p className="form-err" role="alert">
          {err}
        </p>
      )}
      <div className="dash-table">
        <table>
          <thead>
            <tr>
              <th>Person</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Period ends</th>
              <th>Tokens (30 days)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="meta">
                  Nobody has chosen a plan yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.user_id}>
                <td>
                  <b>{r.name || r.email.split("@")[0]}</b>
                  <br />
                  <small className="meta">{r.email}</small>
                </td>
                <td>
                  <select
                    className="h-9 rounded-r1 border-0 bg-surface-muted px-2.5 font-sans text-[13.5px] text-fg"
                    value={r.plan_id}
                    disabled={pending}
                    onChange={(e) => change(r.user_id, e.target.value)}
                    aria-label={`Plan for ${r.email}`}
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    <option value="">No plan</option>
                  </select>
                </td>
                <td>{r.status === "active" ? (r.cancel_at_period_end ? "Cancels at period end" : "Active") : "Cancelled"}</td>
                <td suppressHydrationWarning>{r.period_end ? new Date(r.period_end).toLocaleDateString() : "–"}</td>
                <td>{formatTokens(r.tokens_30d)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
