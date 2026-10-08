import { describe, expect, it } from "vitest";
import { makeFrom, type Executor, type Spec } from "../../src/lib/api/builder";

/** A fake executor that records the spec it was asked to run. */
function capture() {
  const seen: Spec[] = [];
  const run: Executor = async (spec) => {
    seen.push(spec);
    return { data: [], error: null, count: null };
  };
  return { db: makeFrom(run), seen };
}

describe("query builder → spec", () => {
  it("builds a filtered, ordered select", async () => {
    const { db, seen } = capture();
    await db
      .from("tasks")
      .select("id,title")
      .eq("done", false)
      .neq("priority", 4)
      .in("id", ["a", "b"])
      .order("created_at", { ascending: false })
      .limit(5);
    expect(seen[0]).toMatchObject({
      table: "tasks",
      op: "select",
      columns: "id,title",
      filters: [
        { column: "done", op: "eq", value: false },
        { column: "priority", op: "neq", value: 4 },
        { column: "id", op: "in", value: ["a", "b"] },
      ],
      order: [{ column: "created_at", ascending: false }],
      limit: 5,
    });
  });

  it("supports or-groups, not() and null checks", async () => {
    const { db, seen } = capture();
    await db.from("tasks").select("*").or('title.ilike."%x%",description.ilike."%x%"').not("id", "is", null);
    expect(seen[0].or).toEqual(['title.ilike."%x%",description.ilike."%x%"']);
    expect(seen[0].filters[0]).toMatchObject({ column: "id", op: "is", value: null, not: true });
  });

  it("insert / update / delete / upsert set the operation and values", async () => {
    const { db, seen } = capture();
    await db.from("notes").insert({ title: "a" });
    await db.from("notes").update({ title: "b" }).eq("id", "1");
    await db.from("notes").delete().eq("id", "1");
    await db.from("profiles").upsert({ preferences: {} }, { onConflict: "user_id" });
    expect(seen.map((s) => s.op)).toEqual(["insert", "update", "delete", "upsert"]);
    expect(seen[0].values).toEqual({ title: "a" });
    expect(seen[3].onConflict).toBe("user_id");
  });

  it("a write followed by select() asks for the written row back", async () => {
    const { db, seen } = capture();
    await db.from("chats").insert({ title: "x" }).select("id,title").single();
    expect(seen[0]).toMatchObject({ op: "insert", returning: "id,title", single: "single" });
    expect(seen[0].columns).toBeUndefined();
  });

  it("count/head and ranges are passed through", async () => {
    const { db, seen } = capture();
    await db.from("tasks").select("*", { count: "exact", head: true }).range(0, 9).maybeSingle();
    expect(seen[0]).toMatchObject({ count: "exact", head: true, range: [0, 9], single: "maybe" });
  });

  it("turns a thrown error into { error } instead of rejecting", async () => {
    const db = makeFrom(async () => {
      throw new Error("boom");
    });
    const r = await db.from("tasks").select("*");
    expect(r.data).toBeNull();
    expect(r.error?.message).toBe("boom");
  });
});
