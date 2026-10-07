# src/components/layout

**Purpose:** Page scaffolding shared by many screens: app shell, split panes (list + editor), centred containers, card/section wrappers, responsive drawers. **Owner:** track A. **Jira:** UNT-49, UNT-50.

Today these patterns exist as CSS classes (`ap-page`, `ap-split`, `tdo`, `cx`, `adm`, `jr`) repeated per feature. Extract common ones (e.g. "sidebar + main with mobile drawer", used by To-do and Chat) into components here when a task needs a third copy.

## Rules

- Layout components are content-agnostic (take `children`/slots).
- Mobile behaviour is part of the component (drawer ≤ 900 px, bottom sheets ≤ 700 px).
