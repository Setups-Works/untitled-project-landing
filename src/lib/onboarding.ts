/** Onboarding progress lives in the account's `user_metadata.onboarding`, next to preferences — no extra table needed. */
export type Onboarding = {
  completed: boolean;
  /** Last step the user reached, so we resume where they left off. */
  step: number;
  /** ISO time the user chose "Skip for now"; we ask again after SNOOZE_DAYS. */
  skippedAt: string | null;
};

export const ONBOARDING_STEPS = 4;
const SNOOZE_DAYS = 3;

export function cleanOnboarding(v: unknown): Onboarding {
  const o = (v && typeof v === "object" ? v : {}) as Partial<Onboarding>;
  const step = typeof o.step === "number" && o.step >= 0 && o.step < ONBOARDING_STEPS ? Math.floor(o.step) : 0;
  return {
    completed: o.completed === true,
    step,
    skippedAt: typeof o.skippedAt === "string" && !Number.isNaN(Date.parse(o.skippedAt)) ? o.skippedAt : null,
  };
}

/** New users and existing users who never finished see it; a skip hides it for a few days. */
export function shouldShowOnboarding(o: Onboarding, now = Date.now()) {
  if (o.completed) return false;
  if (!o.skippedAt) return true;
  return now - Date.parse(o.skippedAt) > SNOOZE_DAYS * 86_400_000;
}
