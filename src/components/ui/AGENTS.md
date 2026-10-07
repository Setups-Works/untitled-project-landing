# src/components/ui — primitives

**Purpose:** The design-system building blocks every screen uses. **Owner:** track A (with B reviewing). **Jira:** UNT-50.

Planned contents: `Button`, `Input`, `Select`, `Switch`, `Tabs`, `Toast`, `Skeleton`, `Modal`, `Menu`, `ConfirmDialog` / `PromptDialog` (extract from `components/app/{Modal,Menu,Confirm}.tsx`).

## Rules

- No data fetching, no feature knowledge, no business logic.
- Use existing CSS tokens/classes; don't invent colours. Support `data-density` and reduced motion.
- Keyboard + screen-reader support is mandatory: focus trap and Escape for dialogs, `aria-expanded`/`role="menu"` for menus, `role="switch"` for switches.
- Each primitive has a short usage example in this file when added.
- API stability matters — three developers depend on these. Changing a prop = update all callers in the same PR.
