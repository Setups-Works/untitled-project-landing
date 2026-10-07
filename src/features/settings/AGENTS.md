# features/settings

**Does:** the Settings popup (opened from the avatar menu): Profile (name, email, picture), Preferences (time format, default note category, week start, To-do start page), Appearance (density, reduce motion), Security (password, sessions), Your data (JSON/CSV/Markdown export), Danger zone (reset workspace, delete account). **Track B. Built.**

**Today (legacy):** `components/app/{SettingsView,SettingsModal,PrefsSync}.tsx`, `lib/prefs.ts`, `app/dashboard/settings/actions.ts`.

**Backed by:** Supabase auth metadata (`user_metadata.preferences`, `avatar_url`), bucket `avatars`, `profiles`.

**Rules**

- Preferences are saved to the account **and** mirrored into localStorage by `PrefsSync` so plain helpers (`fmtTime`, `weekdayIndex`) can read them synchronously. Add a new preference in three places: `Prefs` + `cleanPrefs` in `lib/prefs.ts`, the Settings UI, and wherever it takes effect.
- Destructive actions (reset, delete) require typed confirmation and a dialog. Delete account runs on the server and removes storage files too.
- Export must cover every user table; update it whenever a table is added (UNT-102).

**Jira:** UNT-102 (data-rights review), UNT-92 (notification preferences), UNT-93 (AI review opt-in).
