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
        columns: "id,title,updated_at,last_read_at",
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
      dbQuery<Chat>({ table: "chats", op: "insert", values: { title }, returning: "id,title,updated_at,last_read_at", single: "single" }),
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

  return { createChat, addMessage, removeChat, refreshMessages: (id: string) => qc.invalidateQueries({ queryKey: keys.messages(id) }) };
}
