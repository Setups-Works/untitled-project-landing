# Instagram Story set

Six story slides authored at 1080 × 1920 and exported as high-resolution 2160 × 3840 PNGs. Slides 1–5 use screenshots from `assets/screens/` inside the transparent iPhone 15 mockup in `assets/iphone-15-frame.png`; the phone and screenshot scale together. Slide 6 shows all services in a grouped grid. Every slide uses the landing page wordmark and campaign typography and colors. Provider logos are stored in `assets/logos/`. The Instagram-style segmented progress meter has been removed.

The screens are captures of the real app pages: Home, To-do, Notes, Journal, and Chat. The standalone HTML composes those captures into Story-sized artwork; it is not an embedded React Native runtime.

## Preview and edit

Open `index.html` in a browser. Use the arrow keys or on-screen arrows to move between slides. The source uses the app's Geist and Instrument Serif fonts and mirrors the mobile design tokens.

## Export PNGs

Run `node marketing/instagram-survey/render.cjs` from the repository root. This writes one 1080 × 1920 PNG per slide to `slides/`. It uses the installed Playwright package and local Chrome; set `CHROME_PATH` if Chrome is installed elsewhere.

## Slides

1. Home: a personal overview of tasks, notes, journal entries, and conversations
2. To-do: turn priorities into clear next steps
3. Notes: capture and organize useful ideas
4. Journal: reflect with writing, photos, and voice notes
5. AI chat: explore questions and keep useful answers close
6. Integrations: see connected services by category and current availability
