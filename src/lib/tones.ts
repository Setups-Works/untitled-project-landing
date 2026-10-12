/** The eight colour tints (`at-<tint>` in globals.css). Whitelisted here so a tone coming from data can never inject a class name. */
export const TONES = ["violet", "blue", "green", "amber", "clay", "mint", "gold", "sand"] as const;
export type Tone = (typeof TONES)[number];

export const isTone = (t: unknown): t is Tone => typeof t === "string" && (TONES as readonly string[]).includes(t);
/** `at-<tint>` for a valid tone, otherwise nothing. */
export const toneClass = (t: unknown) => (isTone(t) ? `at-${t}` : "");
