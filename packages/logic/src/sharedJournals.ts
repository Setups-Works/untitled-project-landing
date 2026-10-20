import type { JournalPerson, SharedJournalEntry, SharedJournalInviteRole, SharedJournalRole } from "@untitled/types";

/** Pure helpers for shared journals, used by the web and the app. */

/** Limits that the server enforces and the screens show, defined once. */
export const SHARED_JOURNAL = {
  nameMax: 80,
  /** Members plus open invitations one journal can hold. */
  maxPeople: 20,
  bodyMax: 50_000,
  attachmentsMax: 20,
  usernameMin: 3,
  usernameMax: 30,
  /** Entries per page of a journal's feed. */
  pageSize: 100,
  /** Largest page a client may ask for. */
  pageMax: 200,
  /** Invitations one person may send per hour (a guard against spamming usernames). */
  invitesPerHour: 30,
} as const;

export const ROLE_LABEL: Record<SharedJournalRole, string> = { owner: "Owner", editor: "Editor", viewer: "Viewer" };

/** One line saying what a role can do, shown next to the role picker. */
export const ROLE_HELP: Record<SharedJournalRole, string> = {
  owner: "Manages people and can delete the journal or any entry.",
  editor: "Reads everything and writes entries of their own.",
  viewer: "Reads everything, writes nothing.",
};

/** The colour tint each role wears, so a role reads the same wherever it appears (web `at-<tint>`, app `Tints`). */
export const ROLE_TONE = { owner: "green", editor: "blue", viewer: "sand" } as const satisfies Record<SharedJournalRole, string>;

/** The roles an owner can hand out, in the order a picker lists them. */
export const INVITE_ROLES: SharedJournalInviteRole[] = ["editor", "viewer"];

export const canWrite = (role: SharedJournalRole) => role !== "viewer";

/** What to show for a person: their name, or their @username when they never set a name. */
export const personName = (p: Pick<JournalPerson, "name" | "username">) => p.name.trim() || (p.username ? `@${p.username}` : "Someone");

/** One or two capital letters for a round avatar. */
export function initials(p: Pick<JournalPerson, "name" | "username">) {
  const words = (p.name.trim() || p.username || "?").split(/[\s._-]+/).filter(Boolean);
  return ((words[0]?.[0] ?? "?") + (words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "")).toUpperCase();
}

const TONES = ["violet", "blue", "green", "amber", "clay", "mint", "gold", "sand"] as const;
export type ShareTone = (typeof TONES)[number];

/** A stable colour for a person or a journal, so the same one looks the same on every screen and device. */
export function toneFor(id: string): ShareTone {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

/** Entries grouped by day, in the order they arrive (the API sends the newest day first, oldest entry first within a day). */
export function groupByDay(entries: SharedJournalEntry[]): { date: string; entries: SharedJournalEntry[] }[] {
  const out: { date: string; entries: SharedJournalEntry[] }[] = [];
  for (const e of entries) {
    const last = out[out.length - 1];
    if (last && last.date === e.entry_date) last.entries.push(e);
    else out.push({ date: e.entry_date, entries: [e] });
  }
  return out;
}

/** Folder name, inside an author's storage folder, that holds files attached to shared-journal entries. */
export const SHARED_JOURNAL_FILES = "shared-journal";

/** `<author>/shared-journal/<journal>/`: where one author's files for one journal live. The server only accepts uploads under the author's own prefix. */
export const journalFilePrefix = (userId: string, journalId: string) => `${userId}/${SHARED_JOURNAL_FILES}/${journalId}/`;

/** The storage path for a file attached to an entry. */
export const journalFilePath = (userId: string, journalId: string, uuid: string, safeFileName: string) =>
  `${journalFilePrefix(userId, journalId)}${uuid}-${safeFileName}`;
