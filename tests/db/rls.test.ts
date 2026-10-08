import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execute } from "../../src/server/db/execute";
import { pool } from "../../src/server/db/pool";
import type { Spec } from "../../src/lib/api/builder";

/**
 * Database tests: the API's query layer against the real PostgreSQL with Row-Level Security.
 * Run with `npm run test:db` (needs `docker compose up -d` and `npm run db:migrate`). They create two throwaway users and
 * delete them (and everything they own, by cascade) afterwards.
 */
const run = Date.now().toString(36);
const A = { kind: "user" as const, userId: "" };
const B = { kind: "user" as const, userId: "" };

const spec = (over: Partial<Spec> & Pick<Spec, "table" | "op">): Spec => ({ filters: [], or: [], order: [], ...over });
const clientRun = (s: Spec, actor: typeof A) => execute(s, actor, { clientTables: true });

beforeAll(async () => {
  const mk = async (tag: string) =>
    (
      await pool().query<{ id: string }>("insert into auth.users (name, email) values ($1, $2) returning id", [
        `rls ${tag}`,
        `rls-${tag}-${run}@example.test`,
      ])
    ).rows[0].id;
  A.userId = await mk("a");
  B.userId = await mk("b");
  for (const id of [A.userId, B.userId])
    await pool().query("insert into public.profiles (user_id) values ($1) on conflict do nothing", [id]);
});

afterAll(async () => {
  await pool().query("delete from auth.users where email like $1", [`rls-%-${run}@example.test`]);
  await pool().end();
});

describe("row-level security through the query layer", () => {
  it("lets a user create and read their own rows", async () => {
    const ins = await clientRun(spec({ table: "tasks", op: "insert", values: { title: "mine" }, returning: "id,title,user_id" }), A);
    expect(ins.error).toBeNull();
    const rows = ins.data as { id: string; title: string; user_id: string }[];
    expect(rows[0]).toMatchObject({ title: "mine", user_id: A.userId }); // user_id defaults to the signed-in user
    const list = await clientRun(spec({ table: "tasks", op: "select", columns: "title" }), A);
    expect((list.data as unknown[]).length).toBe(1);
  });

  it("hides one user's rows from another and ignores their updates and deletes", async () => {
    const seen = await clientRun(spec({ table: "tasks", op: "select", columns: "title" }), B);
    expect(seen.data).toEqual([]);
    const upd = await clientRun(
      spec({
        table: "tasks",
        op: "update",
        values: { title: "hijacked" },
        filters: [{ column: "title", op: "eq", value: "mine" }],
        returning: "id",
      }),
      B,
    );
    expect(upd.data).toEqual([]);
    const del = await clientRun(
      spec({ table: "tasks", op: "delete", filters: [{ column: "title", op: "eq", value: "mine" }], returning: "id" }),
      B,
    );
    expect(del.data).toEqual([]);
    const still = await clientRun(spec({ table: "tasks", op: "select", columns: "title" }), A);
    expect(still.data).toEqual([{ title: "mine" }]);
  });

  it("refuses to create a row owned by someone else", async () => {
    const r = await clientRun(spec({ table: "tasks", op: "insert", values: { title: "spoof", user_id: A.userId } }), B);
    expect(r.error?.code).toBe("42501");
  });

  it("does not let a user change their own plan, but allows their settings", async () => {
    const plan = await clientRun(
      spec({ table: "profiles", op: "update", values: { plan: "pro" }, filters: [{ column: "user_id", op: "eq", value: B.userId }] }),
      B,
    );
    expect(plan.error?.code).toBe("42501");
    const prefs = await clientRun(
      spec({
        table: "profiles",
        op: "upsert",
        values: { preferences: { timeFormat: "24h" } },
        onConflict: "user_id",
        returning: "plan,preferences",
      }),
      B,
    );
    expect(prefs.error).toBeNull();
    expect(prefs.data).toEqual([{ plan: "free", preferences: { timeFormat: "24h" } }]);
  });

  it("only exposes allow-listed tables to the browser", async () => {
    for (const table of ["admin_audit", "schema_migrations", "users"]) {
      const r = await clientRun(spec({ table, op: "select", columns: "*" }), A);
      expect(r.error?.code).toBe("400");
    }
  });

  it("rejects unknown columns, SQL in identifiers, and unfiltered writes", async () => {
    expect((await clientRun(spec({ table: "tasks", op: "select", columns: "title; drop table tasks" }), A)).error?.code).toBe("400");
    expect((await clientRun(spec({ table: "tasks", op: "select", columns: "nope" }), A)).error?.code).toBe("400");
    expect((await clientRun(spec({ table: "tasks", op: "delete" }), A)).error?.code).toBe("400");
    expect((await clientRun(spec({ table: "tasks", op: "update", values: { title: "x" } }), A)).error?.code).toBe("400");
    const still = await clientRun(spec({ table: "tasks", op: "select", columns: "title" }), A);
    expect((still.data as unknown[]).length).toBe(1);
  });

  it("treats filter values as data, not SQL", async () => {
    const r = await clientRun(
      spec({ table: "tasks", op: "select", columns: "title", filters: [{ column: "title", op: "eq", value: "x' or '1'='1" }] }),
      A,
    );
    expect(r.data).toEqual([]);
  });

  it("supports counts, ranges and single-row helpers", async () => {
    await clientRun(spec({ table: "tasks", op: "insert", values: [{ title: "two" }, { title: "three" }] }), A);
    const c = await clientRun(spec({ table: "tasks", op: "select", columns: "id", count: "exact", head: true }), A);
    expect(c.count).toBe(3);
    expect(c.data).toBeNull();
    const page = await clientRun(
      spec({ table: "tasks", op: "select", columns: "title", order: [{ column: "title", ascending: true }], range: [0, 1] }),
      A,
    );
    expect(page.data).toEqual([{ title: "mine" }, { title: "three" }]);
    const none = await clientRun(
      spec({ table: "tasks", op: "select", columns: "id", filters: [{ column: "title", op: "eq", value: "zzz" }], single: "maybe" }),
      A,
    );
    expect(none.data).toBeNull();
    expect(none.error).toBeNull();
    const many = await clientRun(spec({ table: "tasks", op: "select", columns: "id", single: "single" }), A);
    expect(many.error?.code).toBe("PGRST116");
  });

  it("embeds a related row (chat message → chat title)", async () => {
    const chat = await clientRun(spec({ table: "chats", op: "insert", values: { title: "Embed me" }, returning: "id" }), A);
    const id = (chat.data as { id: string }[])[0].id;
    await clientRun(spec({ table: "chat_messages", op: "insert", values: { chat_id: id, role: "user", body: "hello" } }), A);
    const r = await clientRun(spec({ table: "chat_messages", op: "select", columns: "body,chats(title)" }), A);
    expect(r.data).toEqual([{ body: "hello", chats: { title: "Embed me" } }]);
    // another user cannot add a message to this chat
    const intruder = await clientRun(spec({ table: "chat_messages", op: "insert", values: { chat_id: id, role: "user", body: "hi" } }), B);
    expect(intruder.error?.code).toBe("42501");
  });

  it("owner access bypasses RLS (server code only)", async () => {
    const r = await execute(
      spec({ table: "tasks", op: "select", columns: "title", filters: [{ column: "user_id", op: "eq", value: A.userId }] }),
      { kind: "owner" },
    );
    expect((r.data as unknown[]).length).toBe(3);
  });
});
