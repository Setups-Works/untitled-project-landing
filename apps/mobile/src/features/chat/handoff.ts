import { router } from "expo-router";

/** Makes each hand-off unique, so asking the same thing twice still starts a second chat. */
let sent = 0;

/**
 * Opens the Chat tab with a first message that is sent by itself in a new chat (the Health actions use it). The assistant answers, and
 * anything it drafts (a journal entry, a note) still waits for the person to confirm in the chat.
 */
export function askChat(message: string, how: "push" | "replace" = "push") {
  sent += 1;
  const params = { ask: message.slice(0, 500), n: String(sent) };
  if (how === "replace") router.replace({ pathname: "/chat", params });
  else router.push({ pathname: "/chat", params });
}
