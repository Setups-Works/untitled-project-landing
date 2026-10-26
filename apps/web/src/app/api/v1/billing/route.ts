import { handler } from "../../../../server/api/handler";
import { getMyBilling } from "../../../../server/services/billing/billing.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Your plan, this period's AI use, the plans on offer and whether your own key is saved (never the key itself). */
export const GET = handler({}, ({ userId }) => getMyBilling(userId));
