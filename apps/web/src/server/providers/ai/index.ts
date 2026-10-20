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

export type AiChoice = { id: string; label: string; note: string; runtime: AiProvider["runtime"]; available: boolean };

/** What the model picker shows: one entry per model (id "provider:model"), or one per provider that has a single model. */
export async function listChoices(): Promise<AiChoice[]> {
  const out: AiChoice[] = [];
  for (const p of PROVIDERS) {
    const available = p.isAvailable();
    const models = available && p.models ? await p.models().catch(() => []) : [];
    if (models.length) {
      for (const m of models) out.push({ id: `${p.id}:${m.id}`, label: m.label, note: p.note, runtime: p.runtime, available });
    } else {
      out.push({ id: p.id, label: p.label, note: p.note, runtime: p.runtime, available });
    }
  }
  return out;
}

/** Splits a picker id ("groq:openai/gpt-oss-120b") into the provider and the chosen model (absent = provider default). */
export function parseChoice(id: string): { provider: AiProvider | null; model?: string } {
  const i = id.indexOf(":");
  return i < 0 ? { provider: getProvider(id) } : { provider: getProvider(id.slice(0, i)), model: id.slice(i + 1) };
}
