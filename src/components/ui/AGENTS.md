# src/components/ui — primitives

**Purpose:** The design-system building blocks every screen uses. **Owner:** track A (with B reviewing). **Jira:** UNT-50.

**Done (built on Radix, so focus trap, Escape, arrow-key nav and portals come for free):**

- `Modal` — `<Modal label onClose size top>…</Modal>` (Radix Dialog; `label` is the accessible title).
- `useConfirm()` / `usePrompt()` (`Confirm.tsx`) — `await confirm({...})` → boolean; `await prompt({...})` → string | null (AlertDialog / Dialog).
- `Menu` (+ `MenuItem`, `MenuCheckItem`, `MenuRadioGroup`, `MenuRadioItem`, `MenuLabel`, `MenuSeparator`) — Radix DropdownMenu.
- `Tabs` (+ list/trigger/content wrappers) — Radix Tabs; style via `[aria-selected=true]`.

Planned: `Button`, `Input`, `Select`, `Switch`, `Toast`, `Skeleton`.

## Rules

- No data fetching, no feature knowledge, no business logic.
- Use existing CSS tokens/classes; don't invent colours. Support `data-density` and reduced motion.
- Keyboard + screen-reader support is mandatory: focus trap and Escape for dialogs, `aria-expanded`/`role="menu"` for menus, `role="switch"` for switches.
- Each primitive has a short usage example in this file when added.
- API stability matters — three developers depend on these. Changing a prop = update all callers in the same PR.
