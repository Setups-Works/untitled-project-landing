import type { Attachment } from "@untitled/types";

export type Chat = { id: string; title: string; updated_at: string; last_read_at: string };
export type Message = { id: string; role: "user" | "assistant"; body: string; created_at: string; attachments: Attachment[] };
export type AiProvider = { id: string; label: string; note: string; runtime: "server" | "client"; available: boolean };
