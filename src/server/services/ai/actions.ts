import "server-only";
import { serverEnv } from "../../../config/env";
import { itemPath, parseChatAction } from "../../../lib/chat-actions";
import { userDb } from "../../db/builders";
import { getMessageBody, replaceMessageBody } from "../../repositories/chat-messages.repository";
import { createJournalEntry } from "../../repositories/journal.repository";
import { createNote } from "../../repositories/notes.repository";
import { createTask } from "../../repositories/tasks.repository";

/** Creates the saved proposal attached to an assistant message after the user confirms its preview. */
export async function createChatItem(userId: string, messageId: string) {
  const db = userDb(userId);
  const original = await getMessageBody(db, messageId);
  if (!original) return null;
  const { action, body } = parseChatAction(original);
  if (!action) return null;
  let item: { id: string; path: string };
  if (action.kind === "note") {
    const created = await createNote(db, { title: action.title, body: action.body });
    item = { id: created.id, path: itemPath(action.kind, created.id) };
  } else if (action.kind === "journal") {
    const created = await createJournalEntry(db, { body: action.body, entry_date: action.entry_date });
    item = { id: created.id, path: itemPath(action.kind, created.id, created.entry_date) };
  } else {
    const created = await createTask(db, { title: action.title, description: action.description, due_date: action.due_date });
    item = { id: created.id, path: itemPath(action.kind, created.id) };
  }
  const label = action.kind === "task" ? "to-do" : action.kind === "journal" ? "journal entry" : "note";
  const absolutePath = new URL(item.path, serverEnv().authUrl).toString();
  await replaceMessageBody(db, messageId, `${body}\n\n[Open your ${label}](${absolutePath})`);
  return { kind: action.kind, id: item.id, path: item.path };
}
