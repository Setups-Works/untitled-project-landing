import { serverEnv } from "../../../../config/env";
import { json } from "../../../../server/http";

export const dynamic = "force-dynamic";

/** What the sign-in page needs to know about this deployment (never any secret). */
export async function GET() {
  const e = serverEnv();
  return json({ google: Boolean(e.google.clientId && e.google.clientSecret), configured: Boolean(e.databaseUrl && e.authSecret) });
}
