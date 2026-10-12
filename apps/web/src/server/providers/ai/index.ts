import { groqProvider } from "./groq";
import { puterProvider } from "./puter";
import type { AiProvider } from "./types";

export * from "./types";

/** Every provider the app knows about. Add new providers here — nothing else needs to change. */
const PROVIDERS: AiProvider[] = [groqProvider, puterProvider];

export const listProviders = () => PROVIDERS;
export const getProvider = (id: string) => PROVIDERS.find((p) => p.id === id) ?? null;
/** First provider that is implemented and configured, or null (the app then runs "No AI" mode). */
export const defaultProvider = () => PROVIDERS.find((p) => p.runtime === "server" && p.isAvailable()) ?? null;
