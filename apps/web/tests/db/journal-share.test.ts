import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "../../src/server/db/pool";
import { NotFoundError } from "../../src/server/errors";
import { getPublicEntry, setEntryShared } from "../../src/server/services/journal/journal.service";

/**
 * Sharing one journal entry by a secret link, against the real PostgreSQL with Row-Level Security.
 * Run with `corepack pnpm test:db` (needs `docker compose up -d` and `corepack pnpm db:migrate`).
 */
const run = Date.now().toString(36);
const user = { owner: "", other: "" };
let entryId = "";

beforeAll(async () => {
  for (const tag of ["owner", "other"] as const) {
    const { rows } = await pool().query<{ id: string }>("insert into auth.users (name, email) values ($1, $2) returning id", [
      `js ${tag}`,
      `js-${tag}-${run}@example.test`,
    ]);
    user[tag] = rows[0].id;
  }
  const { rows } = await pool().query<{ id: string }>(
    "insert into public.journal_entries (user_id, entry_date, body) values ($1, '2026-10-20', 'a private thought') returning id",
    [user.owner],
  );
  entryId = rows[0].id;
});

afterAll(async () => {
  await pool().query("delete from auth.users where email like $1", [`js-%-${run}@example.test`]);
  await pool().end();
});

describe("sharing a journal entry", () => {
  it("is private until the author makes a link", async () => {
    const { rows } = await pool().query("select share_token from public.journal_entries where id = $1", [entryId]);
    expect(rows[0].share_token).toBeNull();
    expect(await getPublicEntry("0".repeat(32))).toBeNull();
  });

  it("lets only the author create the link", async () => {
    await expect(setEntryShared(user.other, entryId, true)).rejects.toBeInstanceOf(NotFoundError);
    const token = await setEntryShared(user.owner, entryId, true);
    expect(token).toMatch(/^[a-f0-9]{32}$/);
  });

  it("shows the entry by its token without any author identity", async () => {
    const { rows } = await pool().query<{ share_token: string }>("select share_token from public.journal_entries where id = $1", [entryId]);
    const entry = await getPublicEntry(rows[0].share_token);
    expect(entry).toMatchObject({ entryDate: "2026-10-20", body: "a private thought", files: [] });
    expect(JSON.stringify(entry)).not.toContain(user.owner);
  });

  it("makes a new token each time and ends the old link when switched off", async () => {
    const first = (await pool().query<{ share_token: string }>("select share_token from public.journal_entries where id = $1", [entryId]))
      .rows[0].share_token;
    const second = await setEntryShared(user.owner, entryId, true);
    expect(second).not.toBe(first);
    expect(await getPublicEntry(first)).toBeNull();
    expect(await setEntryShared(user.owner, entryId, false)).toBeNull();
    expect(await getPublicEntry(second!)).toBeNull();
  });
});
