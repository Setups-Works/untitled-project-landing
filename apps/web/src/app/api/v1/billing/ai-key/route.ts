import { handler } from "../../../../../server/api/handler";
import { removeByoKey, saveByoKey } from "../../../../../server/services/billing/billing.service";
import { byoKeyInput } from "../../../../../server/services/billing/billing.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Save the API key for the Bring your own key plan. It is stored encrypted and never returned. */
export const POST = handler({ write: true, body: byoKeyInput }, ({ userId, body }) => saveByoKey(userId, body));

/** Remove the saved key. */
export const DELETE = handler({ write: true }, ({ userId }) => removeByoKey(userId));
