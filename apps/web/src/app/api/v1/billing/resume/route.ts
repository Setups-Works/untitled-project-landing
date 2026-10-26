import { handler } from "../../../../../server/api/handler";
import { resumePlan } from "../../../../../server/services/billing/billing.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Keep a subscription that was set to cancel. */
export const POST = handler({ write: true }, ({ userId }) => resumePlan(userId));
