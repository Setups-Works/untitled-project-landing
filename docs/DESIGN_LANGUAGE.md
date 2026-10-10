# Design language — read this before you build any UI

The app has one look: **warm cream canvas, ink text, forest-green accent, soft frosted-glass surfaces, serif display headings, pill buttons, pastel tints.** Every screen must look like it came from the same hand. A screen that is "clean and modern" in a generic way (thin grey borders, `bg-gray-100`, small `text-xs` everything, black rectangles) is **wrong here**, even if it works.

If you are an AI agent: do not invent styling. Copy from the reference screens below, reuse the tokens and classes in this file, and compare your result side by side with the To-do page (`/dashboard/todo`) before opening a PR.

> Source of truth for values: `:root` in `src/app/globals.css` (top of file) and `src/styles/tailwind.css`. This file explains how to use them.

## 1. Reference screens (copy these, don't reinterpret)

| Need                                | Look at                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| Page header, tools row, empty state | `src/components/app/todo/TodoApp.tsx` (`tdo-head`, `tdo-title`, `tdo-tools`)                     |
| Glass card with a tint              | `ap-card at-violet` in `src/components/app/todo/Views.tsx` (`CalendarLayout`)                    |
| Dialog with a form                  | `src/components/app/todo/TaskDialog.tsx` + `TaskForm.tsx` (`td`, `tf`, `tf-pill`)                |
| Date picking                        | `src/components/app/JournalCalendar.tsx` (the site's own calendar — never `<input type="date">`) |
| Tabs / segmented control            | `src/components/ui/Tabs.tsx`, styled like the top-bar section switcher                           |
| Confirm / prompt                    | `useConfirm()` / `usePrompt()` in `src/components/ui/Confirm.tsx`                                |
| A feature fully built to this guide | `src/features/calendar/` (Tailwind utilities + tokens, TanStack Query, Radix wrappers)           |

## 2. Typography

Fonts are loaded in `src/app/layout.tsx` and exposed as `--serif`, `--sans`, `--mono` (Tailwind: `font-serif`, `font-sans`, `font-mono`).

| Use                                     | Font                                 | Notes                                                                                       |
| --------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| Page titles, dialog titles, big numbers | **Instrument Serif** (`font-serif`)  | Weight 400 only. Negative tracking: `tracking-[-0.03em]`, `leading-[1.04]`, `text-balance`. |
| Everything else (UI, body, buttons)     | **Geist** (`font-sans`, the default) | Body 14–15 px. Small labels 12–13.5 px. Never go below 11 px.                               |
| Counters, code, keyboard hints          | **Geist Mono** (`font-mono`)         |                                                                                             |
| Tamil text                              | Noto Sans Tamil                      | Loaded automatically; don't set it by hand.                                                 |

- Page title: `font-serif text-[clamp(30px,3.4vw,42px)] leading-[1.04] font-normal tracking-[-0.03em] text-balance` (same as `.tdo-title .h2`). Dialog title: legacy class `h3` (28 px serif).
- Small uppercase section labels: `text-[11px] font-semibold tracking-[0.1em] uppercase text-fg-faint` (same as `.ap-sec`).
- Italic green accent word in marketing headings: class `quiet`.
- **Form controls do not inherit the font.** Always `font: inherit` (or use the `tf-*` classes). A bare `<textarea>` renders monospace.

## 3. Colour tokens

Defined once in `:root`; Tailwind names in brackets. **Never write a hex colour that already has a token.**

| Token                                                                            | Tailwind                       | Use                                          |
| -------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------- |
| `--page` `#f5f4eb`                                                               | `bg-page`                      | The cream canvas (set on `body`)             |
| `--surface` `#fff`, `--surface-muted`, `--surface-sunken`, `--surface-accent`    | `bg-surface…`                  | Solid fills (chips, hover states)            |
| `--fg` `#1b1c14` (ink), `--fg-strong`, `--fg-muted`, `--fg-subtle`, `--fg-faint` | `text-fg`, `text-fg-muted`, …  | Text, from strongest to faintest             |
| `--fill-dark` `#191d1a`, `--on-dark` `#f4f3e9`                                   | `bg-fill-dark`, `text-on-dark` | Dark pills (primary button, "today" number)  |
| `--line` (10 % ink), `--line-strong` (20 %)                                      | `bg-line`, `border-line`       | Hairlines — **sparingly** (see §5)           |
| `--green-fg` `#1f5d49` (forest)                                                  | `text-green-fg`                | The accent: focus ring, links, "quiet" words |
| `--{green,blue,amber,clay,violet,sand}-{bg,fg}`                                  | `bg-clay-bg text-clay-fg`, …   | Soft status colours (errors use clay)        |

No dark mode today. The only global switches are attributes on `<html>`: `data-density="compact"` and `data-motion="reduce"` — respect them.

### Tints (`at-<tint>`)

Eight tints: `violet blue green amber clay mint gold sand`. `.at-<tint>` **only defines three variables** — it paints nothing by itself:

- `--ab` pastel background · `--abl` hairline colour · `--abf` strong foreground.

To paint, add the `tint` utility (`background: var(--ab); color: var(--abf); box-shadow: inset 0 0 0 1px var(--abl)`), or use the variables yourself (`bg-(--abf)` for a solid dot). **Forgetting this paints nothing** — the original calendar PR rendered every colour swatch grey for exactly this reason.

```tsx
<span className={`at-${tone} tint rounded-[7px] px-2 py-[3px] text-[12px]`}>Standup</span>
<button className={`at-${tone} size-7 rounded-full bg-(--abf)`} />   // solid colour dot
```

Don't pass user data into `at-${…}` without a whitelist (the calendar uses `toneOf()` to fall back to blue).

## 4. Surfaces: glass, not borders

Cards, pills and buttons are **frosted glass with a hairline inset ring**, not bordered boxes.

- Tailwind utilities (in `src/styles/tailwind.css`): `glass` (translucent fill + blur + ring), `glass-hover` (brighter on hover), `tint` (see above).
- Legacy equivalents: `ap-card` (card), `btn btn-secondary` (glass pill), `tf-pill` (form pill).
- Radii: `rounded-r1` 10 · `r2` 14 · `r3` 20 (cards) · `r4` 28 (dialogs) · `rounded-pill`. Small chips use `rounded-[7px]`.
- Shadows: `shadow-e1` … `e4` (warm, low-contrast). Never `shadow-md`/`shadow-lg` (grey, harsh).
- Dialogs are the _thick_ frosted version (`Modal` handles it). Don't restyle them.
- Grid lines inside a card: a 1 px gap over `bg-line` with translucent white cells (`grid gap-px bg-line` + `bg-white/60` cells), as in the month view and `.tv-cal-grid`. Not `border` on every cell.

**Avoid:** `border border-line` around cards, `divide-y` tables, `bg-gray-*`, `rounded-md`, drop shadows on everything, pure `#000`.

## 5. Buttons and controls

| Control                | Use                                                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Primary action         | `btn btn-primary btn-sm` (dark pill, 44 px). One per view.                                                                    |
| Secondary action       | `btn btn-secondary btn-sm` (glass pill)                                                                                       |
| Icon-only round button | `ne-btn` (38 px circle; add `aria-label`). `data-on="true"` for the pressed state.                                            |
| Toggle / filter pill   | Glass pill (`glass glass-hover rounded-pill h-[38px] px-3.5 text-[13.5px]`); when on, `at-<tint> tint`.                       |
| Segmented control      | `Tabs` + `glass rounded-pill p-1` list; active trigger = **white pill** (`data-[state=active]:bg-white shadow-e1`), not dark. |
| Form pill              | `tf-pill` (+ `tf-date` for a date pill wrapping `JournalCalendar`). Title input `tf-title`, notes `tf-desc`.                  |
| Menus, popovers        | `Menu` (Radix). Don't hand-roll.                                                                                              |
| Delete / destructive   | `useConfirm().ask({ danger: true })` first — never delete on one click.                                                       |

Pressed state is `active:scale-95` with the spring easing; hover is a background change, not an outline. Focus rings come from the global `:focus-visible` (2 px forest green) — never `outline-none` without a replacement.

Do not mix a legacy class and a utility that set the same property (e.g. `btn` + `h-[38px]`). Pick one.

## 6. Layout and spacing

- Dashboard pages are already inside `.ap-body` (padding `20px clamp(16px,3vw,32px)`). Your page root is just `mx-auto w-full max-w-[1120px]` (todo uses 940 px for list-like pages).
- Header: serif title on the left, primary action on the right, tools row beneath (nav, view tabs, filters), `mb-[18px]` below.
- Card padding 16–22 px; gaps 8 / 12 / 18. Hit targets ≥ 38–40 px.
- **Mobile first, 375 px.** No horizontal page scroll. Wide grids sit in an `overflow-x-auto` wrapper with a `min-w-*` inner. Breakpoint the app uses most: `max-[900px]` (compact grids) and `sm` = 640 px. Phones default to list-style views.

## 7. Motion

- Easings: `--ease` `cubic-bezier(0.22,1,0.36,1)`; `--spring` `cubic-bezier(0.34,1.45,0.5,1)` for press/hover bounce. Durations 160–300 ms.
- Always honour `prefers-reduced-motion` and `html[data-motion="reduce"]` (`motion-reduce:` plus `[html[data-motion=reduce]_&]:`).

## 8. Content and tone

- Sentence case everywhere ("New event", "Delete event"). No Title Case Buttons.
- Friendly, short, no exclamation marks. Errors: "Couldn’t save that change." — never the raw error. Use the curly apostrophe ’.
- Empty states are one quiet line (`ap-none` class) with the next step, not a big illustration.
- Icons: **Font Awesome Free Solid only**, via `FontAwesomeIcon as FA`. No emoji in UI, no other icon sets.
- Errors in forms: `<p className="form-err" role="alert">`.

## 9. How a screen is built (the whole stack, so the look and the behaviour match)

1. **Route** in `src/app/dashboard/<name>/page.tsx` — thin; wrap in `ClientOnly` + `Suspense` when it prints dates.
2. **Data** with TanStack Query: keys in `src/lib/query/keys.ts` (`qk`), hooks in `src/features/<name>/queries.ts` (copy `features/tasks/queries.ts`: optimistic update → rollback → invalidate). **No `useEffect` fetching, no `useState` copies of server data.**
3. **Realtime**: `useRealtimeInvalidate("<table>", [qk.…])`; the table needs the notify trigger (a new migration — see `20261010130000_calendar_events_realtime.sql`).
4. **Overlays** use the Radix wrappers in `src/components/ui` (`Modal`, `Menu`, `Tabs`, `useConfirm`). Dialog components are mounted only while open, so initial form values are plain `useState` defaults (no effect to re-sync them).
5. **Pure logic** (grouping, layout, date maths) lives in a `utils.ts` next to the feature and gets table-driven Vitest tests (`tests/unit/`).
6. Styling is **Tailwind utilities + tokens**. If you convert a legacy screen, delete its rules from `globals.css` in the same PR and keep it pixel-identical.

## 10. Checklist before you open the PR

- [ ] Put your screen next to `/dashboard/todo` at desktop width and at 375 px. Same fonts, same glass, same radii, same buttons?
- [ ] Every colour is a token or an `at-<tint>` + `tint`; no raw hex that has a token; no `gray-*`/`slate-*`.
- [ ] Title is Instrument Serif; body is Geist; textareas/inputs inherit the font.
- [ ] No `<input type="date|time">` styled by the browser where `JournalCalendar` / a `tf-pill` select fits.
- [ ] No native `alert/confirm/prompt`; destructive actions confirm.
- [ ] Keyboard: everything reachable, visible focus, labels on icon buttons, `aria-pressed`/`aria-selected` on toggles, colour never the only signal.
- [ ] Reduced motion and compact density respected.
- [ ] No hydration mismatches (dates/times only inside `ClientOnly`).
- [ ] `npx tsc --noEmit`, `npm test`, `npx next build` pass.

## 11. Mistakes this guide exists to prevent (all seen in real PRs)

| Mistake                                                          | Why it's wrong / what to do instead                                          |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `at-blue` on a chip with no `tint`                               | `at-*` sets variables only. Add `tint` (or `bg-(--ab)`).                     |
| `border border-line` boxes, `divide-x/y` grids                   | Use `glass` surfaces and the 1 px gap-over-`bg-line` grid.                   |
| Tiny `text-xs` everywhere, sans-serif page title                 | Titles are serif ~30–42 px; UI text 13.5–15 px.                              |
| `<input type="date">` / `type="time"`                            | Native pickers look foreign. Use `JournalCalendar` + a `tf-pill` `<select>`. |
| A bare `<textarea>`                                              | Renders monospace. Use `tf-desc` or `font: inherit`.                         |
| Reusing a legacy popup rule blindly (`tf-date` opens _upward_)   | Check where your control sits; override the placement.                       |
| Hand-rolled load/reload `useEffect` + `useState` for server data | Use TanStack Query + `qk` + realtime (§9).                                   |
| Re-implementing task data fetching in another feature            | Import `useTasks()` so every screen shows the same cache.                    |
| Delete on a single click                                         | `useConfirm({ danger: true })`.                                              |
| 24 × 7 `role="button"` divs as tab stops in a grid               | One click target per column; provide a keyboard shortcut / button instead.   |
| Dark rectangle buttons (`bg-fg rounded-md text-xs`)              | `btn btn-primary btn-sm` (pill, 44 px).                                      |
