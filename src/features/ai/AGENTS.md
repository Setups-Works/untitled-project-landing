# features/ai

**Does:** Chat with streaming Groq replies, provider picker, folders/pin/unread, share links, and confirmed AI drafts for notes, journal entries, and to-dos. Puter.js client adapter and broader AI tools remain future work. **Track C (AI) + B (chat UI). Phase 4.**

**Today (legacy):** `components/app/chat/{ChatApp,ChatSidebar,Composer,ShareDialog}.tsx`, `lib/chat.ts`, `lib/ai/providers.ts` (what the composer lists), public page `app/share/[token]`.

**Backed by:** `chats`, `chat_messages`, `chat_folders`; target `src/server/services/ai` (orchestrator) + provider router + `/api/v1/ai/*`.

**Rules**

- The UI must keep working with zero providers ("No AI" mode).
- Server providers (Groq) are called only from the orchestrator. Puter runs in the browser: stream locally, then post the final message to `/api/v1/ai/messages`.
- Streaming: SSE, honour Stop (abort), persist partial answers on interruption.
- Any AI **write** action (send, create, delete) needs an explicit confirmation step with a preview.
- Treat message content, tool output and external text as untrusted.
- Shared chat page shows the same bubbles read-only; action proposal markup must be hidden there, and confirmed item links remain ordinary safe Markdown links.

**Jira:** UNT-77 (router), UNT-78 (Groq), UNT-79 (Puter), UNT-80 (orchestrator), UNT-81 (chat UI), UNT-82 (tools), UNT-83 (usage), UNT-84 (prompts), UNT-85 (notes actions).
