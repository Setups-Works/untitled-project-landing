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
- **Waitlist + survey in one flow** (`/waitlist`) – join in ten seconds, then an optional nine-step survey whose card changes colour each step. Entries are stored in MongoDB.
- **Admin** (`/admin`) – password-protected dashboard with stats, colourful survey insights, searchable waitlist and survey tables, delete and CSV export.
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

## Waitlist, survey and admin

Data lives in MongoDB (`waitlist`, `surveys` and `admins` collections). Copy `.env.example` to `.env.local` and fill it in:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `MONGODB_DB` | Database name (default `untitled_project`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | The admin account. It is created on first sign-in and stored **hashed** (scrypt), never in plain text |
| `SESSION_SECRET` | Random string that signs the admin session cookie |

Set the same variables in your host (for example Vercel → Project → Settings → Environment Variables). `.env.local` is git-ignored — never commit real values. In MongoDB Atlas, allow your host's IPs under Network Access.

Admin sign-in is at `/admin/login`. Sessions are signed, `httpOnly` cookies that last eight hours, and login attempts are throttled per IP. Public forms use a honeypot field and server-side validation.

## Accounts (Supabase Auth)

`/login`, `/signup`, `/forgot-password` and `/reset-password` use [Supabase Auth](https://supabase.com/docs/guides/auth) with email + password and Google sign-in. `/dashboard` is protected by middleware.

1. Create a Supabase project and copy **Project URL** and **anon public key** (Project Settings → API) into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. In **Authentication → URL Configuration** set *Site URL* to your site (for example `http://localhost:3000`) and add `http://localhost:3000/auth/callback` and your production `/auth/callback` URL to *Redirect URLs*.
3. For Google sign-in, enable the Google provider under **Authentication → Providers** and add your OAuth client ID and secret.
4. Email confirmation links and password-reset links go through `/auth/callback`, which exchanges the code for a session and then redirects.

Without the keys the pages still render and show a setup notice instead of failing.

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
