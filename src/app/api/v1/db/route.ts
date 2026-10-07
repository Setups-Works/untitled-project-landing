import { z } from "zod";
import { execute } from "../../../../server/db/execute";
import { forbidden, json, sameOrigin, unauthorized } from "../../../../server/http";
import { currentUser } from "../../../../server/session";

const ident = z.string().regex(/^[a-z_][a-z0-9_]*$/);
const spec = z.object({
  table: ident,
  op: z.enum(["select", "insert", "update", "delete", "upsert"]),
  columns: z.string().max(500).optional(),
  returning: z.string().max(500).nullish(),
  values: z.union([z.record(z.string(), z.unknown()), z.array(z.record(z.string(), z.unknown())).max(500)]).optional(),
  filters: z
    .array(
      z.object({
        column: ident,
        op: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "in", "is"]),
        value: z.unknown(),
        not: z.boolean().optional(),
      }),
    )
    .max(30),
  or: z.array(z.string().max(1000)).max(5),
  order: z.array(z.object({ column: ident, ascending: z.boolean(), nullsFirst: z.boolean().optional() })).max(5),
  limit: z.number().int().min(1).max(5000).optional(),
  range: z.tuple([z.number().int().min(0), z.number().int().min(0)]).optional(),
  single: z.enum(["single", "maybe"]).optional(),
  count: z.literal("exact").optional(),
  head: z.boolean().optional(),
  onConflict: z.string().max(200).optional(),
});

/**
 * The browser's only door to the database. The query is validated, checked against the real schema and an allow-list of tables,
 * and run inside a transaction as the signed-in user, so Postgres Row-Level Security decides what they can see and change.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const user = await currentUser();
  if (!user) return unauthorized();
  const parsed = spec.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ data: null, count: null, error: { message: "Bad request.", code: "400" } }, 400);
  return json(await execute(parsed.data, { kind: "user", userId: user.id }, { clientTables: true }));
}
