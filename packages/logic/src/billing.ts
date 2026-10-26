import type { BillingPlan } from "@untitled/types";

/** AI providers a person can bring their own key for. Fixed on purpose: the server only ever calls these addresses. */
export const BYO_PROVIDERS = [
  { id: "openai", label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  { id: "groq", label: "Groq", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  { id: "openrouter", label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "openai/gpt-4o-mini" },
  { id: "together", label: "Together AI", baseUrl: "https://api.together.xyz/v1", model: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  { id: "mistral", label: "Mistral", baseUrl: "https://api.mistral.ai/v1", model: "mistral-small-latest" },
  { id: "deepseek", label: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
] as const;

export type ByoProviderId = (typeof BYO_PROVIDERS)[number]["id"];
export const byoProvider = (id: string) => BYO_PROVIDERS.find((p) => p.id === id) ?? null;

/** The number format each currency is written in; anything else uses US formatting. */
const LOCALE: Record<string, string> = { inr: "en-IN" };

/** "₹749", "₹749.50", "Free": money in the smallest unit of the currency (paise for rupees). The product prices in rupees by default. */
export function formatMoney(cents: number, currency = "inr"): string {
  if (cents <= 0) return "Free";
  const amount = cents / 100;
  return new Intl.NumberFormat(LOCALE[currency.toLowerCase()] ?? "en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

/** "1M", "250K", "1,200": tokens in a short form. */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString("en-US");
}

/** The price line for a plan: "$9 / month", "$2 per 1M tokens", "Free". */
export function priceLine(plan: Pick<BillingPlan, "id" | "price_cents" | "currency" | "interval" | "token_price_cents_per_million">): string {
  if (plan.id === "payg") {
    return plan.token_price_cents_per_million > 0
      ? `${formatMoney(plan.token_price_cents_per_million, plan.currency)} per 1M tokens`
      : "Free";
  }
  if (plan.price_cents <= 0) return "Free";
  const per = plan.interval === "year" ? "year" : plan.interval === "month" ? "month" : "";
  return per ? `${formatMoney(plan.price_cents, plan.currency)} / ${per}` : formatMoney(plan.price_cents, plan.currency);
}

/** Cost of `tokens` at a per-million rate, in the smallest currency unit, rounded up so a tiny amount is never silently free. */
export const tokenCostCents = (tokens: number, centsPerMillion: number) => Math.ceil((tokens * centsPerMillion) / 1_000_000);

/** A rough token count for text when a provider doesn't report usage: about four characters to a token. */
export const estimateTokens = (chars: number) => Math.max(0, Math.ceil(chars / 4));

/** `from` plus `n` months, keeping the day of the month where the target month has it (31 Jan + 1 month = 28 Feb). */
export function addMonths(from: Date, n: number): Date {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d;
}
export const addMonth = (from: Date) => addMonths(from, 1);
