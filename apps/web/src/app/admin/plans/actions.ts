"use server";
import { revalidatePath } from "next/cache";
import type { PlanId } from "@untitled/types";
import { ServiceError } from "../../../server/errors";
import { audit, assertAdmin, getUserById } from "../../../server/session";
import { adminSetUserPlan, adminUpdatePlan } from "../../../server/services/billing/billing.service";
import { planIdInput, planPatchInput } from "../../../server/services/billing/billing.schema";

type Result = { ok: true; message?: string } | { ok: false; error: string };
const UUID = /^[0-9a-f-]{36}$/i;

/** Edits a plan's price, allowance, rate, wording or availability. The pricing page and Settings read the same rows, so it shows everywhere at once. */
export async function savePlan(id: string, patch: unknown): Promise<Result> {
  try {
    const me = await assertAdmin();
    const plan = planIdInput.safeParse({ planId: id });
    const parsed = planPatchInput.safeParse(patch);
    if (!plan.success) return { ok: false, error: "That plan doesn’t exist." };
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "That doesn’t look right." };
    await adminUpdatePlan(plan.data.planId, parsed.data);
    await audit(me, "plan.update", plan.data.planId, { fields: Object.keys(parsed.data) });
    revalidatePath("/admin/plans");
    revalidatePath("/pricing");
    return { ok: true, message: "Plan saved." };
  } catch (e) {
    return { ok: false, error: e instanceof ServiceError ? e.message : "Not allowed." };
  }
}

/** Puts a person on a plan, or off every plan with null. Used for support and for people who pay outside the app. */
export async function setUserPlan(userId: string, planId: PlanId | null): Promise<Result> {
  try {
    const me = await assertAdmin();
    if (typeof userId !== "string" || !UUID.test(userId)) return { ok: false, error: "Bad user id." };
    if (planId !== null && !planIdInput.safeParse({ planId }).success) return { ok: false, error: "That plan doesn’t exist." };
    const user = await getUserById(userId);
    if (!user) return { ok: false, error: "User not found." };
    await adminSetUserPlan(userId, planId);
    await audit(me, planId ? "plan.assign" : "plan.clear", user.email || userId, { plan: planId });
    revalidatePath("/admin/plans");
    return { ok: true, message: planId ? "Plan updated." : "Plan removed." };
  } catch (e) {
    return { ok: false, error: e instanceof ServiceError ? e.message : "Not allowed." };
  }
}
