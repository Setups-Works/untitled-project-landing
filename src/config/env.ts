/**
 * Typed access to environment variables. One place to read them, one place to see what the app needs.
 *
 * - `publicEnv` — values that are safe in the browser (NEXT_PUBLIC_*). Import it anywhere.
 * - `serverEnv()` — secrets. Only call it from server code (src/server, route handlers, server actions).
 *
 * Missing optional integrations return `undefined`; use `requireEnv` when a feature cannot work without a value.
 */

export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || undefined,
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || undefined,
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com",
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || undefined,
} as const;

export class MissingEnvError extends Error {
  constructor(
    public readonly name: string,
    hint?: string,
  ) {
    super(`Missing environment variable ${name}.${hint ? ` ${hint}` : ""}`);
    this.name = "MissingEnvError";
  }
}

/** Read a server-only variable, throwing a helpful error if it is not set. */
export function requireEnv(name: string, hint?: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new MissingEnvError(name, hint);
  return v;
}

const optional = (name: string) => process.env[name]?.trim() || undefined;

/** Server-only secrets. Never import this from a client component. */
export function serverEnv() {
  if (typeof window !== "undefined") throw new Error("serverEnv() was called in the browser. Secrets must stay on the server.");
  return {
    databaseUrl: optional("DATABASE_URL"),
    redisUrl: optional("REDIS_URL"),
    s3: {
      endpoint: optional("S3_ENDPOINT"),
      accessKey: optional("S3_ACCESS_KEY"),
      secretKey: optional("S3_SECRET_KEY"),
    },
    smtpUrl: optional("SMTP_URL"),
    authSecret: optional("BETTER_AUTH_SECRET"),
    authUrl: optional("BETTER_AUTH_URL") ?? optional("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000",
    google: { clientId: optional("GOOGLE_CLIENT_ID"), clientSecret: optional("GOOGLE_CLIENT_SECRET") },
    adminEmails: (optional("ADMIN_EMAILS") ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
    groqApiKey: optional("GROQ_API_KEY"),
    composioApiKey: optional("COMPOSIO_API_KEY"),
    sentryAuthToken: optional("SENTRY_AUTH_TOKEN"),
    cronSecret: optional("CRON_SECRET"),
  } as const;
}
