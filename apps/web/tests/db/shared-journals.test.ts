import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "../../src/server/db/pool";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../src/server/errors";
import * as svc from "../../src/server/services/collaboration/collaboration.service";

/**
 * Shared journals against the real PostgreSQL with Row-Level Security: invitations, roles and who may read or write what.
 * Run with `corepack pnpm test:db` (needs `docker compose up -d` and `corepack pnpm db:migrate`). Three throwaway users, removed
 * (with everything they own, by cascade) afterwards.
 */
const run = Date.now().toString(36);
const user = { owner: "", ed: "", stranger: "" };
const name = (tag: string) => `sj-${tag}-${run}`;
const today = "2026-10-20";

beforeAll(async () => {
  for (const tag of ["owner", "ed", "stranger"] as const) {
    const { rows } = await pool().query<{ id: string }>("insert into auth.users (name, email, username) values ($1, $2, $3) returning id", [
      `sj ${tag}`,
      `${name(tag)}@example.test`,
      name(tag),
    ]);
    user[tag] = rows[0].id;
  }
});

afterAll(async () => {
  await pool().query("delete from auth.users where email like $1", [`sj-%-${run}@example.test`]);
  await pool().end();
});

describe("shared journals", () => {
  let journalId = "";
  let inviteId = "";

  it("lets anyone start a journal and become its owner", async () => {
    const j = await svc.createJournal(user.owner, "Trip");
    journalId = j.id;
    expect(j).toMatchObject({ name: "Trip", role: "owner", me: user.owner });
    expect(j.members).toHaveLength(1);
  });

  it("hides the journal from people who aren't in it", async () => {
    await expect(svc.getJournal(user.stranger, journalId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(svc.listEntries(user.stranger, journalId, { limit: 10 })).rejects.toBeInstanceOf(NotFoundError);
    expect(await svc.listJournals(user.stranger)).toEqual([]);
  });

  it("invites by username and refuses bad invitations", async () => {
    await expect(svc.inviteByUsername(user.owner, journalId, "nobody-here", "editor")).rejects.toBeInstanceOf(NotFoundError);
    await expect(svc.inviteByUsername(user.owner, journalId, name("owner"), "editor")).rejects.toBeInstanceOf(ValidationError);
    await expect(svc.inviteByUsername(user.ed, journalId, name("stranger"), "editor")).rejects.toBeInstanceOf(NotFoundError);
    const sent = await svc.inviteByUsername(user.owner, journalId, name("ed"), "editor");
    inviteId = sent.id;
    await expect(svc.inviteByUsername(user.owner, journalId, name("ed"), "viewer")).rejects.toBeInstanceOf(ConflictError);
  });

  it("shows the invitation to the invitee only, and gives no access until it is accepted", async () => {
    const mine = await svc.listMyInvites(user.ed);
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ journal_name: "Trip", role: "editor" });
    expect(await svc.listMyInvites(user.stranger)).toEqual([]);
    await expect(svc.getJournal(user.ed, journalId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(svc.respondToInvite(user.stranger, inviteId, "accept")).rejects.toBeInstanceOf(NotFoundError);
    expect((await svc.getJournal(user.owner, journalId)).invites).toHaveLength(1);
  });

  it("makes the invitee a member when they accept, once", async () => {
    await svc.respondToInvite(user.ed, inviteId, "accept");
    const j = await svc.getJournal(user.ed, journalId);
    expect(j.role).toBe("editor");
    expect(j.members.map((m) => m.role).sort()).toEqual(["editor", "owner"]);
    expect(j.invites).toEqual([]); // only the owner is told about invitations
    await expect(svc.respondToInvite(user.ed, inviteId, "accept")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lets editors write and edit only their own entries; the owner can delete any", async () => {
    const mine = await svc.addEntry(user.ed, journalId, { entry_date: today, body: "from the editor", kind: "text", attachments: [] });
    const theirs = await svc.addEntry(user.owner, journalId, { entry_date: today, body: "from the owner", kind: "text", attachments: [] });
    expect(mine.author.id).toBe(user.ed);
    await expect(svc.editEntry(user.ed, journalId, theirs.id, { body: "hijack" })).rejects.toBeInstanceOf(NotFoundError);
    await expect(svc.editEntry(user.owner, journalId, mine.id, { body: "hijack" })).rejects.toBeInstanceOf(NotFoundError);
    expect((await svc.editEntry(user.ed, journalId, mine.id, { body: "edited" })).body).toBe("edited");
    await expect(svc.removeEntry(user.ed, journalId, theirs.id)).rejects.toBeInstanceOf(NotFoundError);
    await svc.removeEntry(user.owner, journalId, mine.id);
    expect((await svc.listEntries(user.ed, journalId, { limit: 10 })).entries.map((e) => e.id)).toEqual([theirs.id]);
  });

  it("refuses files that aren't in the author's own folder of the journal", async () => {
    const file = { path: `${user.owner}/shared-journal/${journalId}/x-a.png`, name: "a.png", type: "image/png", size: 1 };
    await expect(
      svc.addEntry(user.ed, journalId, { entry_date: today, body: "", kind: "text", attachments: [file] }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(await svc.mayUseJournalFile(user.ed, file.path, false)).toBe(true); // anyone in the journal may read it
    expect(await svc.mayUseJournalFile(user.ed, file.path, true)).toBe(false); // but only its author uploads into that folder
    expect(await svc.mayUseJournalFile(user.stranger, file.path, false)).toBe(false);
    expect(await svc.mayUseJournalFile(user.ed, `${user.ed}/journal/x/y.png`, false)).toBeNull(); // not a shared-journal path
  });

  it("makes viewers read-only and only the owner manages people", async () => {
    await svc.changeRole(user.owner, journalId, user.ed, "viewer");
    await expect(svc.addEntry(user.ed, journalId, { entry_date: today, body: "x", kind: "text", attachments: [] })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(svc.changeRole(user.ed, journalId, user.ed, "editor")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(svc.inviteByUsername(user.ed, journalId, name("stranger"), "viewer")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(svc.renameJournal(user.ed, journalId, "Mine now")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(svc.deleteJournal(user.ed, journalId)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("lets a member leave, but the owner must delete instead", async () => {
    await expect(svc.removeMember(user.owner, journalId, user.owner)).rejects.toBeInstanceOf(ValidationError);
    await svc.removeMember(user.ed, journalId, user.ed);
    await expect(svc.getJournal(user.ed, journalId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lets the owner withdraw an invitation and invitees decline", async () => {
    const a = await svc.inviteByUsername(user.owner, journalId, name("stranger"), "viewer");
    await svc.cancelInvite(user.owner, journalId, a.id);
    expect(await svc.listMyInvites(user.stranger)).toEqual([]);
    const b = await svc.inviteByUsername(user.owner, journalId, name("stranger"), "viewer");
    await svc.respondToInvite(user.stranger, b.id, "decline");
    await expect(svc.getJournal(user.stranger, journalId)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deletes a journal with its entries when the owner asks", async () => {
    await svc.deleteJournal(user.owner, journalId);
    expect(await svc.listJournals(user.owner)).toEqual([]);
    const { rows } = await pool().query("select 1 from public.shared_journal_entries where journal_id = $1", [journalId]);
    expect(rows).toEqual([]);
  });
});
