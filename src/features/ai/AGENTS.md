# features/ai

**Does:** Chat (sidebar with folders/pin/unread, composer, share links) today; in Phase 4 streaming AI replies, provider picker, Puter.js client adapter, AI actions in notes. **Track C (AI) + B (chat UI). Phase 4.**

**Today (legacy):** `components/app/chat/{ChatApp,ChatSidebar,Composer,ShareDialog}.tsx`, `lib/chat.ts`, `lib/ai/providers.ts` (what the composer lists), public page `app/share/[token]`.

**Backed by:** `chats`, `chat_messages`, `chat_folders`; target `src/server/services/ai` (orchestrator) + provider router + `/api/v1/ai/*`.

**Rules**
- **No AI replies exist yet.** The UI says so ("No AI" mode) and must keep working with zero providers.
- Server providers (Groq) are called only from the orchestrator. Puter runs in the browser: stream locally, then post the final message to `/api/v1/ai/messages`.
- Streaming: SSE, honour Stop (abort), persist partial answers on interruption.
- Any AI **write** action (send, create, delete) needs an explicit confirmation step with a preview.
- Treat message content, tool output and external text as untrusted.
- Shared chat page shows the same bubbles read-only; if you add message types, update it too.

**Jira:** UNT-77 (router), UNT-78 (Groq), UNT-79 (Puter), UNT-80 (orchestrator), UNT-81 (chat UI), UNT-82 (tools), UNT-83 (usage), UNT-84 (prompts), UNT-85 (notes actions).
