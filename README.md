# untitled project — landing page

A responsive, interactive marketing page for **untitled project**: one workspace for notes, tasks, journal, email, calendar, meetings and automations — with an AI layer you can swap, bring your own key to, or switch off entirely.

Built with **Next.js 15 (App Router)**, **React 19** and **TypeScript**. Styling is hand-written CSS driven by design tokens — no Tailwind, no UI kit.

## Highlights

- **Interactive hero** – a working app preview: switch between Home, Journal, Notes, To-do, Email, Calendar, Meetings and Automations, tick tasks, open emails and flip automation switches.
- **Workspace areas carousel** – tall colour-coded cards, each with a round **+** button that opens a details popup (Esc, ✕ or a click outside closes it).
- **Scroll stack** – Journal → Notes → Email → Calendar → Integrations panels stick one after another as you scroll.
- **Integrations carousel** – every integration grouped by category with its real full-colour logo.
- **AI switcher** – shows the workspace staying put while the AI behind it changes (supported account, your own API key, pay-as-you-go, or no AI).
- **Pro stats** – count-up numbers for email accounts, calendars and bundled AI subscriptions.
- **Inner pages** – How it works, Universal Search, Context Graph and Daily Brief (each with an interactive demo), Product demo, Pricing, Early users, and Privacy & Security.
- **Animated FAQ** accordion, a closing call to action and a footer.
- **Responsive** – mobile menu, card grids that become swipeable carousels, no horizontal overflow.
- **Accessible** – keyboard-operable controls, `aria` states, visible focus rings and `prefers-reduced-motion` support.

## Getting started

Requires Node.js 18.18 or newer.

```bash
npm install
npm run dev      # http://localhost:3000
```

| Script          | What it does                         |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the dev server with hot reload |
| `npm run build` | Production build                     |
| `npm start`     | Serve the production build           |

> Don't run `npm run build` while `npm run dev` is running — both write to `.next` and the dev server will start throwing `__webpack_modules__[moduleId] is not a function`. Stop the dev server (or delete `.next`) first.

## Project structure

```
app/
  layout.tsx        Fonts, metadata, shared site header and footer
  page.tsx          Home page, section by section
  how-it-works/  universal-search/  context-graph/  daily-brief/
  demo/  pricing/  early-users/  privacy-security/      Inner pages
  globals.css       Design tokens and all styles
  icon.svg          Favicon (the green dot from the logo)
components/
  Client.tsx        Header, Reveal, Integrations carousel, mobile menu, CountUp, FaqList, MobileCarousel, Logo
  SiteChrome.tsx    Site header (with Features dropdown) and the multi-column footer
  PageKit.tsx       Shared inner-page pieces: hero, section heading, feature cards, closing CTA
  demos/            Interactive Universal Search, Context Graph and Daily Brief demos
  HeroApp.tsx       Interactive app preview in the hero and on /demo
  Areas.tsx         Workspace areas carousel + details popup
  AiSwitcher.tsx    "Your AI can change. Your workspace shouldn't." demo
lib/
  site.ts           Navigation and footer link data
  logos.ts          Brand-colour marks, and which integrations are live
public/logos/       Integration logos (SVG/PNG)
```

## Design system

Tokens live at the top of `app/globals.css` (`:root`).

- **Canvas** `#f5f4eb`, **ink** `#1b1c14`, one quiet accent: forest green `#1f5d49`.
- **Tints** (violet, blue, green, amber, clay, sand) are used for categorisation — e.g. Journal is violet, Notes blue, Email green, Calendar amber, Integrations clay.
- **Type**: Instrument Serif for display, Geist for UI, Geist Mono for counters, Noto Sans Tamil for the Tamil footer line.
- **Shape**: pill buttons, 10–36px radii, hairline `inset` rings instead of borders.
- **Motion**: slow and ambient; always disabled under `prefers-reduced-motion`.

### Handy knobs

- `--panel-h` (in `app/globals.css`, default `560px`) — the shared height of the scroll-stack panels on desktop.
- The scroll stack only activates on screens at least 901px wide and 640px tall; elsewhere the panels flow normally.

## Content

All copy comes from the product content & feature specification. Anything the spec doesn't state — pricing, Personality Insights behaviour, automation triggers — is deliberately not invented. The mock data inside the hero preview (launch plan, Q3 roadmap thread, calendar events) is placeholder.

The "Get started" buttons point at an in-page anchor; wire them to your real sign-up URL.

## Logos & trademarks

Files in `public/logos/` are the property of their respective owners and are shown only to indicate supported integrations. Use them according to each company's brand guidelines. Google Docs and HubSpot are drawn from the CC0 [simple-icons](https://simpleicons.org) set (`lib/logos.ts`). Icons elsewhere are [Font Awesome Free](https://fontawesome.com) (solid).

## Deploying

It's a standard Next.js app with no environment variables or backend, so it deploys as-is to Vercel, Netlify or any Node host (`npm run build && npm start`).

---

Backed by **Setups Works** (செட்டப்ஸ் வொர்க்ஸ்).
