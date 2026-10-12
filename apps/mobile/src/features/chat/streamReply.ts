import { fetch as streamingFetch } from "expo/fetch";

import { mobileEnv } from "@/config/env";
import { authClient, discardLocalSession } from "@/lib/auth-client";
import { isoDate } from "@/lib/dates";

/**
 * Asks the server for the assistant's reply and reports the text as it streams in. The server saves the finished reply,
 * so callers refetch the messages afterwards. React Native's built-in fetch cannot stream bodies; `expo/fetch` can.
 */
export async function streamReply(opts: {
  chatId: string;
  provider: string;
  signal: AbortSignal;
  onText: (text: string) => void;
}): Promise<string | null> {
  const cookie = await authClient?.getCookie();
  const res = await streamingFetch(`${mobileEnv.apiBaseUrl}/api/v1/ai/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    credentials: "omit",
    body: JSON.stringify({ chatId: opts.chatId, provider: opts.provider, localDate: isoDate() }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) {
    if (res.status === 401) await discardLocalSession();
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    return j.error ?? "The AI couldn’t reply. Your message was saved.";
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    opts.onText(text);
  }
  return null;
}
