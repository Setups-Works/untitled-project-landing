# src/components/landing — the marketing site's liquid-glass kit

**Purpose:** everything the public site (`/`, `/how-it-works`, `/pricing`, …) is built from. Read `docs/DESIGN_LANGUAGE.md` §13 first.

## The material

Liquid glass = a bright translucent fill over a strong blur, a specular rim, a diagonal sheen and a glare that follows the pointer,
over the product's colour tints. It only reads as glass when there is colour behind it, so `Ambient` puts soft drifting orbs behind every
marketing page. The CSS lives in `src/styles/tailwind.css` (`liquid`, `liquid-flat`, `liquid-dark`, `liquid-tint`, `liquid-pill`,
`liquid-lift`) with its tokens (`--liquid-*`) in `:root` in `globals.css`. Never write the gradients or shadows inline.

| Use                                          | Component / class                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| A big panel                                  | `<Glass>` (`variant="panel"`, `glare`, `tilt`, `lift`, `tone`)          |
| A card that sits on a panel (no second blur) | `<Glass variant="flat">`                                                |
| Smoked glass for the dark hero/CTA panels    | `<Glass variant="dark">` and the `BTN_LIGHT` / `BTN_GHOST_DARK` buttons |
| Small pills and chips                        | `liquid-pill`                                                           |
| A section, its heading, label, lead          | `Section`, `SectionHead`, `Eyebrow`, `Title`, `Lead` (`Kit.tsx`)        |
| An honest status                             | `StatusChip` (`live` / `building` / `soon`)                             |

## Motion (GSAP) — the rules

- All animation goes through `motion.ts`: `useMotion(ref, ({ g, root, calm }) => …)`. It scopes GSAP to the element, cleans up every tween
  and ScrollTrigger, and re-runs when the visitor's reduced-motion setting changes. **In `calm` mode only make sure content is visible.**
- Content that animates in starts hidden (`opacity-0` + `data-reveal`); `layout.tsx` has a `<noscript>` rule that shows it without JS.
- Pieces: `Reveal` / `R` (fade-rise, optional stagger), `Title` (SplitText line reveal), `Parallax`, `Magnetic`, `Marquee`, `Count`,
  `Cursor` (the interactive cursor; fine pointers only, never replaces the real cursor), `Tip` (hover/focus tooltip, portaled), `ScrollProgress`.
- Mark things the cursor should label with `data-cursor="Play"`.
- Don't put a CSS animation and a GSAP tween on the same element's transform: nest an extra element (see `home/Hero.tsx`).
- Animate transforms and opacity only. Respect `prefers-reduced-motion` and `data-motion="reduce"`.

## Content honesty

`content.ts` holds copy that makes factual claims. A capability is `live` only if it ships today (`docs/CURRENT_STATE.md`); otherwise
`building` or `soon`. When something ships, flip its status; don't reword the claim. Don't add claims about security, features or
numbers that the docs and code don't support, and don't invent testimonials.

## Structure

- `home/` — the sections of the home page (`Hero`, `Why`, `Bento`, `DeepDives` (sticky stack), `Speed`, `AiSection`, `Trust`, `Pro`, `Roadmap`) and `Mocks`.
- `Blocks.tsx` — step cards, day timeline, access matrix, plan comparison. `Faq.tsx`, `IntegrationsTabs.tsx`, `Nav.tsx`, `Logo.tsx`.

## Gotchas

- A server component must not hand a client component's element to something that clones it. `Tip` wraps children in a span instead.
- `Reveal` delays are in **milliseconds**; GSAP's own `delay` is seconds.
- Sticky stacks (`home/DeepDives.tsx`) resolve `#anchor` links from natural positions; keep ids on the direct children of the stack.
