import "server-only";
import pg from "pg";
import { requireEnv } from "../../config/env";

// Dates stay as strings so `date` columns (YYYY-MM-DD) are never shifted by the server's timezone. Query results are produced as
// JSON by Postgres itself (see execute.ts), which already formats timestamps as ISO-8601; these parsers cover everything else.
pg.types.setTypeParser(1082, (v) => v); // date
pg.types.setTypeParser(1114, (v) => v); // timestamp
pg.types.setTypeParser(1184, (v) => v); // timestamptz
pg.types.setTypeParser(20, (v) => Number(v)); // bigint (counts)

const g = globalThis as unknown as { __pgPool?: pg.Pool };

/** One pool per server process (kept across dev hot-reloads). Connects as the database owner; see withUser() for how RLS is applied. */
export function pool() {
  if (!g.__pgPool) {
    g.__pgPool = new pg.Pool({
      connectionString: requireEnv("DATABASE_URL", "Run `docker compose up -d` and copy .env.example to .env.local."),
      max: Number(process.env.PG_POOL_MAX ?? 10),
      idleTimeoutMillis: 30_000,
      statement_timeout: 15_000,
    });
    g.__pgPool.on("error", () => {
      /* an idle client dropped; the pool replaces it */
    });
  }
  return g.__pgPool;
}

/**
 * Runs `fn` in a transaction **as the signed-in user**: the role is switched to `authenticated` and `auth.uid()` returns this user,
 * so every Row-Level Security policy applies exactly as if the user were connecting directly.
 */
export async function withUser<T>(userId: string, fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool().connect();
  try {
    await c.query("begin");
    await c.query("set local role authenticated");
    await c.query("select set_config('app.user_id', $1, true)", [userId]);
    const out = await fn(c);
    await c.query("commit");
    return out;
  } catch (e) {
    await c.query("rollback").catch(() => undefined);
    throw e;
  } finally {
    c.release();
  }
}

/**
 * Runs `fn` as the database owner, which bypasses RLS. Only for server code that has already verified the caller
 * (admin panel, public shared chats, account deletion, the auth library).
 */
export async function withOwner<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool().connect();
  try {
    await c.query("begin");
    const out = await fn(c);
    await c.query("commit");
    return out;
  } catch (e) {
    await c.query("rollback").catch(() => undefined);
    throw e;
  } finally {
    c.release();
  }
}
