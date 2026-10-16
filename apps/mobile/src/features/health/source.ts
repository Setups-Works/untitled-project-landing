import type { HealthSource } from "./source.types";

/** Web and any platform without a health service: nothing to read, so the screen shows an explanation instead of a setup button. */
export const healthSource: HealthSource | null = null;
