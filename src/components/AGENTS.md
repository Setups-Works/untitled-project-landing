# src/components

**Purpose:** UI that is **not tied to one feature**. Feature-specific UI belongs in `src/features/<name>`.

| Subfolder     | For                                                                                         | Status                                                             |
| ------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/`         | Primitives: Button, Input, Select, Switch, Tabs, Toast, Modal, Menu, Confirm/Prompt dialogs | planned (UNT-50) — today `Modal`, `Menu`, `Confirm` live in `app/` |
| `layout/`     | Page scaffolding: shells, containers, sidebars, headers                                     | planned                                                            |
| `navigation/` | Top bars, tabs, breadcrumbs, command/search triggers                                        | planned (`AppNav` moves here)                                      |
| `shared/`     | Cross-feature composites: empty states, avatars, attachment lists, markdown renderer        | planned                                                            |

## Today (legacy locations — move only as part of a Jira task)

- Top-level marketing components: `Client.tsx`, `PageKit.tsx`, `SiteChrome.tsx`, `Areas.tsx`, `HeroApp.tsx`, `MegaPreview.tsx`, `AiSwitcher.tsx`, `NotFoundFun.tsx`, `HideInApp.tsx`; `demo/`, `demos/`.
- `auth/` — login/signup form, shell, `AuthLink`, `HeaderAuth`, `useAuthState`.
- `app/` — the whole signed-in app UI (Home, Notes, Journal, Chat, To-do, Settings, Search…). Moves into `src/features/*` per feature.
- `admin/` — admin panel components.

## Rules

- Components here don't know about database tables or services. They receive data and callbacks.
- Accessibility is part of "done" (roles, labels, focus, keyboard). Reuse before you build.
- Styling: existing CSS tokens/classes in `src/app/globals.css`; no new UI libraries without a PR discussion.
