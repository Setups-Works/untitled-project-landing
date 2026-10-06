/**
 * The AI providers a chat could talk to. The product lets you bring your own AI, use a supported account, or use none.
 * Only providers marked `available` can actually be selected — none are wired up yet, so chat saves messages without replies.
 */
export type Provider = { id: string; label: string; note: string; available: boolean };

export const PROVIDERS: Provider[] = [
  { id: "none", label: "No AI", note: "Messages are saved to the chat. No replies are generated.", available: true },
  { id: "claude", label: "Claude", note: "Use your Anthropic account or API key", available: false },
  { id: "openai", label: "ChatGPT", note: "Use your OpenAI account or API key", available: false },
  { id: "gemini", label: "Gemini", note: "Use your Google account or API key", available: false },
];
