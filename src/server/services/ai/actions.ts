import "server-only";
import { itemPath, markCreated, parseChatActions, type ChatAction, type CreatedItem } from "../../../lib/chat-actions";
import { userDb } from "../../db/builders";
import { getMessageBody, replaceMessageBody } from "../../repositories/chat-messages.repository";
import { createJournalEntry } from "../../repositories/journal.repository";
import { createNote } from "../../repositories/notes.repository";
import { createTask } from "../../repositories/tasks.repository";

type Db = ReturnType<typeof userDb>;

async function create(db: Db, action: ChatAction): Promise<CreatedItem> {
  if (action.kind === "note") {
    const n = await createNote(db, { title: action.title, body: action.body });
    return { kind: "note", path: itemPath("note", n.id) };
  }
  if (action.kind === "journal") {
    const j = await createJournalEntry(db, { body: action.body, entry_date: action.entry_date });
    return { kind: "journal", path: itemPath("journal", j.id, j.entry_date) };
  }
  const t = await createTask(db, { title: action.title, description: action.description, due_date: action.due_date });
  return { kind: "task", path: itemPath("task", t.id) };
}

/**
 * Creates drafts the assistant proposed in one of its messages, but only because the user pressed Create in the chat.
 * `which` is one draft (its position in the message) or "all" for every draft not yet created. Each created draft is marked
 * in the message, so pressing a button twice can never create the same item twice. Returns the items created now.
 */
export async function createChatItems(userId: string, messageId: string, which: number | "all") {
  const db = userDb(userId);
  let text = await getMessageBody(db, messageId); // null unless it is the caller's own assistant message
  if (text === null) return null;
  const { proposals } = parseChatActions(text);
  const todo = proposals.filter((p) => !p.created && (which === "all" || p.index === which));
  if (!todo.length) return null;

  const made: CreatedItem[] = [];
  for (const p of todo) {
    const item = await create(db, p.action);
    text = markCreated(text, p.index, item, p.action);
    made.push(item);
    // Save after every item so a failure part-way keeps what was already created marked as created.
    await replaceMessageBody(db, messageId, text);
  }
  return made;
}
