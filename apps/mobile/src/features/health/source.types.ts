/** One day's totals as read from the phone. A metric the phone has no data for is null. */
export type DayTotals = {
  day: string;
  steps: number | null;
  distance_m: number | null;
  active_kcal: number | null;
  resting_hr: number | null;
  hr_min: number | null;
  hr_max: number | null;
  sleep_minutes: number | null;
};

/** Where health data comes from on this device. There is one implementation per platform (source.ios.ts, source.android.ts). */
export type HealthSource = {
  /** What the server stores in `health_daily.source`. */
  id: "healthkit" | "health_connect";
  /** What to call it in the UI. */
  name: string;
  /** False on simulators, web, or phones without the health service installed. */
  isAvailable: () => Promise<boolean>;
  /** Shows the system permission sheet. Resolves true when the sheet completed; the system never reveals which read types were allowed. */
  requestAccess: () => Promise<boolean>;
  /** Reads the given local calendar days (YYYY-MM-DD). */
  readDays: (days: string[]) => Promise<DayTotals[]>;
  /** Where the person can change the permission afterwards. */
  openSettings: () => void;
};
