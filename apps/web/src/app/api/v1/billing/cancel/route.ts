import { handler } from "../../../../../server/api/handler";
import { cancelPlan } from "../../../../../server/services/billing/billing.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Cancel your plan: a subscription ends with its period, the other plans stop now. */
export const POST = handler({ write: true }, ({ userId }) => cancelPlan(userId));
