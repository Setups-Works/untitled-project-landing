import "server-only";
import { z } from "zod";
import { forbidden, json, sameOrigin, unauthorized } from "../http";
import { currentUser } from "../session";
import { userDb } from "../db/builders";
import { deleteObjects, ownsKey } from "../storage";
import type { ResourceDef } from "../../lib/api/resources";

/**
 * Generic REST handlers for one resource (see lib/api/resources.ts). Every query runs as the signed-in user, so row-level security
 * decides what exists for them; there is no user id in any URL or body.
 */
type Row = Record<string, unknown>;
const uuid = z.string().uuid();
const fail = (msg: string, status: number) => json({ error: msg }, status);
const firstIssue = (e: z.ZodError) => `${e.issues[0]?.path.join(".") || "body"}: ${e.issues[0]?.message ?? "invalid"}`;

async function readBody(req: Request) {
  return req.json().catch(() => null);
}

export function collectionHandlers(def: ResourceDef) {
  return {
    async GET(req: Request) {
      const user = await currentUser();
      if (!user) return unauthorized();
      const q = new URL(req.url).searchParams;
      const limit = Math.min(Math.max(Number(q.get("limit") ?? 100) || 100, 1), 500);
      const offset = Math.max(Number(q.get("offset") ?? 0) || 0, 0);
      let query = userDb(user.id).from<Row>(def.table).select(def.columns);
      for (const [col, kind] of Object.entries(def.filters)) {
        const raw = q.get(col);
        if (raw === null) continue;
        if (kind === "boolean") {
          if (raw !== "true" && raw !== "false") return fail(`${col} must be true or false.`, 400);
          query = query.eq(col, raw === "true");
        } else if (kind === "date") {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return fail(`${col} must be YYYY-MM-DD.`, 400);
          query = query.eq(col, raw);
        } else query = query.eq(col, raw);
      }
      for (const o of def.order) query = query.order(o.column, { ascending: o.ascending });
      const { data, error } = await query.range(offset, offset + limit - 1);
      if (error) return fail("Couldn’t load that list.", 500);
      return json({ data: data ?? [], limit, offset });
    },

    async POST(req: Request) {
      if (!sameOrigin(req)) return forbidden();
      const user = await currentUser();
      if (!user) return unauthorized();
      const p = def.create.safeParse(await readBody(req));
      if (!p.success) return fail(firstIssue(p.error), 400);
      const { data, error } = await userDb(user.id).from<Row>(def.table).insert(p.data).select(def.columns).single();
      if (error || !data) return fail(`Couldn’t create that ${def.singular}.`, 400);
      return json({ data }, 201);
    },
  };
}

type Ctx = { params: Promise<{ id: string }> };

export function itemHandlers(def: ResourceDef) {
  const hasStamp = def.key === "notes" || def.key === "journal";
  return {
    async GET(_req: Request, { params }: Ctx) {
      const user = await currentUser();
      if (!user) return unauthorized();
      const id = uuid.safeParse((await params).id);
      if (!id.success) return fail("Not found.", 404);
      const { data } = await userDb(user.id).from<Row>(def.table).select(def.columns).eq("id", id.data).maybeSingle();
      return data ? json({ data }) : fail("Not found.", 404);
    },

    async PATCH(req: Request, { params }: Ctx) {
      if (!sameOrigin(req)) return forbidden();
      const user = await currentUser();
      if (!user) return unauthorized();
      const id = uuid.safeParse((await params).id);
      if (!id.success) return fail("Not found.", 404);
      const p = def.update.safeParse(await readBody(req));
      if (!p.success) return fail(firstIssue(p.error), 400);
      const values: Row = { ...p.data };
      if (!Object.keys(values).length) return fail("Nothing to change.", 400);
      if (hasStamp) values.updated_at = new Date().toISOString();
      if (def.key === "tasks" && "done" in values && !("done_at" in values)) values.done_at = values.done ? new Date().toISOString() : null;
      const { data, error } = await userDb(user.id).from<Row>(def.table).update(values).eq("id", id.data).select(def.columns).maybeSingle();
      if (error) return fail(`Couldn’t change that ${def.singular}.`, 400);
      return data ? json({ data }) : fail("Not found.", 404);
    },

    async DELETE(req: Request, { params }: Ctx) {
      if (!sameOrigin(req)) return forbidden();
      const user = await currentUser();
      if (!user) return unauthorized();
      const id = uuid.safeParse((await params).id);
      if (!id.success) return fail("Not found.", 404);
      const db = userDb(user.id);
      const { data: row } = await db.from<Row>(def.table).select(def.columns).eq("id", id.data).maybeSingle();
      if (!row) return fail("Not found.", 404);
      const { error } = await db.from(def.table).delete().eq("id", id.data);
      if (error) return fail(`Couldn’t delete that ${def.singular}.`, 500);
      // Files attached to a deleted note or journal entry go with it (only the user's own).
      const files = Array.isArray(row.attachments) ? (row.attachments as { path?: string }[]) : [];
      const keys = files.map((f) => f.path).filter((k): k is string => typeof k === "string" && ownsKey(user.id, k));
      if (keys.length) await deleteObjects("note-files", keys).catch(() => undefined);
      return json({ ok: true });
    },
  };
}
