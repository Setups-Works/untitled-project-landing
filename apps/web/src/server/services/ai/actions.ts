import "server-only";
import {
  describeItem,
  itemPath,
  markCreated,
  parseChatActions,
  resolveRefs,
  type ChatAction,
  type ChatProposal,
  type CreatedItem,
} from "../../../lib/chat-actions";
import { draftDue } from "../../../lib/tasks";
import { userDb } from "../../db/builders";
import { getMessageBody, replaceMessageBody } from "../../repositories/chat-messages.repository";
import { createJournalEntry, setJournalBody } from "../../repositories/journal.repository";
import { createNote } from "../../repositories/notes.repository";
import { createTask } from "../../repositories/tasks.repository";

type Db = ReturnType<typeof userDb>;
type Links = Map<string, { path: string; tip: string }>;

/** The to-dos and notes of this message that exist now, by the short `ref` the journal draft uses to point at them. */
function linksOf(proposals: ChatProposal[]): Links {
  const m: Links = new Map();
  for (const p of proposals) {
    const a = p.action;
    if (p.created && (a.kind === "task" || a.kind === "note") && a.ref) m.set(a.ref, { path: p.created.path, tip: describeItem(a) });
  }
  return m;
}

async function create(db: Db, action: ChatAction, links: Links): Promise<CreatedItem> {
  if (action.kind === "note") {
    const n = await createNote(db, { title: action.title, body: action.body });
    return { kind: "note", id: n.id, path: itemPath("note", n.id) };
  }
  if (action.kind === "journal") {
    // The journal text links to the to-dos and notes made from the same message (those that exist so far).
    const j = await createJournalEntry(db, { body: resolveRefs(action.body, links), entry_date: action.entry_date });
    return { kind: "journal", id: j.id, path: itemPath("journal", j.id, j.entry_date) };
  }
  // A repeating to-do needs a first date that fits its rule ("every 2nd Wednesday" starts on the next 2nd Wednesday).
  const recurrence = action.recurrence ?? null;
  const t = await createTask(db, {
    title: action.title,
    description: action.description,
    due_date: draftDue(action.due_date, recurrence),
    recurrence,
  });
  return { kind: "task", id: t.id, path: itemPath("task", t.id) };
}

/**
 * Creates drafts the assistant proposed in one of its messages, but only because the user pressed Create in the chat.
 * `which` is one draft (its position in the message) or "all" for every draft not yet created. Each created draft is marked
 * in the message, so pressing a button twice can never create the same item twice. Returns the items created now.
 *
 * To-dos and notes are created before the journal entry, so the entry can link to them. If the journal entry was saved earlier
 * and a to-do or note is created later, the entry is updated to link to it too.
 */
export async function createChatItems(userId: string, messageId: string, which: number | "all") {
  const db = userDb(userId);
  let text = await getMessageBody(db, messageId); // null unless it is the caller's own assistant message
  if (text === null) return null;
  let proposals = parseChatActions(text).proposals;
  const todo = proposals
    .filter((p) => !p.created && (which === "all" || p.index === which))
    .sort((a, b) => Number(a.action.kind === "journal") - Number(b.action.kind === "journal") || a.index - b.index);
  if (!todo.length) return null;

  const made: CreatedItem[] = [];
  for (const p of todo) {
    const item = await create(db, p.action, linksOf(proposals));
    text = markCreated(text, p.index, item, p.action);
    made.push(item);
    // Save after every item so a failure part-way keeps what was already created marked as created.
    await replaceMessageBody(db, messageId, text);
    proposals = parseChatActions(text).proposals;
  }

  // A journal entry saved before these items existed gets its links now.
  if (made.some((m) => m.kind !== "journal")) {
    const links = linksOf(proposals);
    for (const p of proposals) {
      if (p.action.kind === "journal" && p.created?.id && !todo.some((t) => t.index === p.index))
        await setJournalBody(db, p.created.id, resolveRefs(p.action.body, links));
    }
  }
  return made;
}
