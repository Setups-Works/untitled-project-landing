/**
 * What the chat's model picker needs to know about an AI provider. The list of providers is NOT hard-coded in the browser:
 * the server reports which ones exist and which are configured (`/api/v1/ai/status`, see features/ai/useAiProviders).
 * The only entry the client owns is "No AI", which always works.
 */
export type Provider = { id: string; label: string; note: string; available: boolean; runtime?: "server" | "client" };

export const NO_AI: Provider = {
  id: "none",
  label: "No AI",
  note: "Messages are saved to the chat. No replies are generated.",
  available: true,
};
