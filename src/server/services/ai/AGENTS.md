# services/ai — AI orchestrator

**Owner:** track C. **Phase 4.** **Jira:** UNT-77 router · UNT-80 orchestrator · UNT-82 tools · UNT-83 usage · UNT-84 prompts · UNT-86 semantic search.

**Done (UNT-80 first slice, UNT-84 first prompt):** `chat.ts` → `startChatReply()` reads the conversation as the signed-in user, streams the provider's answer and saves it as an assistant message; rate limit per user per minute (Redis); `prompts/chat.ts` holds the versioned system prompt. Served by `POST /api/v1/ai/chat`; providers listed by `GET /api/v1/ai/status`. **Not yet:** usage metering, tools, auto-title, regenerate/stop, attachments sent to the model, client-runtime (Puter) hand-off.

**Responsibilities**

- Build the model input: system prompt (versioned, from `prompts/`), a window of the conversation, optional workspace context.
- Choose a provider via the router (`src/server/providers/ai`), stream the answer (SSE), handle stop/regenerate/edit-and-resend.
- Persist assistant messages with provider, model, token usage, finish reason; auto-title chats.
- Tool calling: expose our services/Composio tools to the model; **writes need a user confirmation step** with a preview; log every tool call.
- Meter usage (`ai_usage`) and enforce plan limits _before_ calling a provider.
- "No AI" mode when no provider is available — never an error screen.

**Rules**

- Only this service talks to `AiProvider`s. Features call the orchestrator, not Groq/Puter.
- Treat user content, emails, transcripts and tool output as **untrusted**: keep them in clearly delimited data sections of the prompt, never in the system prompt.
- Prompts are files in `prompts/` with a version string and tests (fixed inputs → expected structure); no ad-hoc prompt strings in routes.
- Respect `AbortSignal`. Never log prompt or answer text.
- Puter (`runtime: "client"`): hand the prepared messages to the browser and accept the final message back through `/api/v1/ai/messages`.
