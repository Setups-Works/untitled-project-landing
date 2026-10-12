import type { Attachment } from "@untitled/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { dbQuery } from "./db";
import type { Chat, Message } from "./types";

const keys = { chats: ["chats"] as const, messages: (id: string) => ["chat-messages", id] as const, providers: ["ai-providers"] as const };

export function useChats() {
  return useQuery({
    queryKey: keys.chats,
    queryFn: async () =>
      (await dbQuery<Chat[]>({
        table: "chats",
        op: "select",
        columns: "id,title,updated_at,last_read_at,pinned,folder_id,share_token",
        order: [{ column: "updated_at", ascending: false }],
        limit: 200,
      })) ?? [],
  });
}

export function useMessages(chatId: string | undefined) {
  return useQuery({
    queryKey: keys.messages(chatId ?? ""),
    enabled: !!chatId && chatId !== "new",
    queryFn: async () =>
      (await dbQuery<Message[]>({
        table: "chat_messages",
        op: "select",
        columns: "id,role,body,created_at,attachments",
        filters: [{ column: "chat_id", op: "eq", value: chatId }],
        order: [{ column: "created_at", ascending: true }],
      })) ?? [],
  });
}

export function useChatActions() {
  const qc = useQueryClient();
  const refreshChats = () => qc.invalidateQueries({ queryKey: keys.chats });

  const createChat = useMutation({
    mutationFn: async (title: string) =>
      dbQuery<Chat>({ table: "chats", op: "insert", values: { title }, returning: "id,title,updated_at,last_read_at,pinned,folder_id,share_token", single: "single" }),
    onSettled: refreshChats,
  });

  const addMessage = useMutation({
    mutationFn: async ({ chatId, body, attachments = [] }: { chatId: string; body: string; attachments?: Attachment[] }) => {
      const msg = await dbQuery<Message>({
        table: "chat_messages",
        op: "insert",
        values: { chat_id: chatId, role: "user", body, attachments },
        returning: "id,role,body,created_at,attachments",
        single: "single",
      });
      const now = new Date().toISOString();
      await dbQuery({
        table: "chats",
        op: "update",
        values: { updated_at: now, last_read_at: now },
        filters: [{ column: "id", op: "eq", value: chatId }],
      });
      return msg;
    },
    onSettled: (_d, _e, v) => {
      void qc.invalidateQueries({ queryKey: keys.messages(v.chatId) });
      void refreshChats();
    },
  });

  const removeChat = useMutation({
    mutationFn: (id: string) => dbQuery({ table: "chats", op: "delete", filters: [{ column: "id", op: "eq", value: id }] }),
    onSettled: refreshChats,
  });

  const patchChat = useMutation({
    mutationFn: ({ id, ...values }: { id: string; title?: string; pinned?: boolean; last_read_at?: string; share_token?: string | null; shared_at?: string | null }) =>
      dbQuery({ table: "chats", op: "update", values, filters: [{ column: "id", op: "eq", value: id }] }),
    onSettled: refreshChats,
  });

  const duplicateChat = useMutation({
    mutationFn: async (chat: Chat) => {
      const copy = await dbQuery<Chat>({
        table: "chats", op: "insert", values: { title: `${chat.title} (copy)`.slice(0, 200), folder_id: chat.folder_id },
        returning: "id,title,updated_at,last_read_at,pinned,folder_id,share_token", single: "single",
      });
      if (!copy) throw new Error("Couldn’t duplicate that chat.");
      const messages = await dbQuery<Message[]>({
        table: "chat_messages", op: "select", columns: "role,body,created_at", filters: [{ column: "chat_id", op: "eq", value: chat.id }], order: [{ column: "created_at", ascending: true }],
      });
      if (messages?.length) {
        await dbQuery({ table: "chat_messages", op: "insert", values: messages.map(({ role, body, created_at }) => ({ chat_id: copy.id, role, body, created_at, attachments: [] })) });
      }
      return copy;
    },
    onSettled: refreshChats,
  });

  return { createChat, addMessage, removeChat, patchChat, duplicateChat, refreshChats, refreshMessages: (id: string) => qc.invalidateQueries({ queryKey: keys.messages(id) }) };
}
