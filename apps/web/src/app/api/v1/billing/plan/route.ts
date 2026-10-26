import { handler } from "../../../../../server/api/handler";
import { choosePlan } from "../../../../../server/services/billing/billing.service";
import { planIdInput } from "../../../../../server/services/billing/billing.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Choose or switch your plan. */
export const POST = handler({ write: true, body: planIdInput }, ({ userId, body }) => choosePlan(userId, body.planId));
