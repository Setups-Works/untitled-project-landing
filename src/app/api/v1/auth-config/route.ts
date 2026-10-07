import { serverEnv } from "../../../../config/env";
import { json } from "../../../../server/http";

export const dynamic = "force-dynamic";

/** What the sign-in page needs to know about this deployment (never any secret). */
export async function GET() {
  const e = serverEnv();
  // The Google client ID is public by design (it is visible in every Google sign-in URL); the secret never leaves the server.
  return json({
    google: Boolean(e.google.clientId && e.google.clientSecret),
    googleClientId: e.google.clientId && e.google.clientSecret ? e.google.clientId : null,
    configured: Boolean(e.databaseUrl && e.authSecret),
  });
}
