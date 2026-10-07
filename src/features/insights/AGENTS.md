# features/insights

**Does:** Personality insights card on Home today (archetype, 8-axis radar, observations, "on your mind" words) computed **in the browser from the user's own journal, notes and tasks — no quiz, no AI**. Planned: an `/insights` page, Daily Brief, AI weekly review. **Track B. Phases 2–5.**

**Today (legacy):** `lib/insights.ts` (pure `analyse()`), `components/app/{InsightsCard,Radar}.tsx`.

**Rules**
- Insights are patterns, not diagnoses — keep that wording. Never invent data; every sentence must trace to a number.
- `analyse()` stays pure and unit-tested. Heavier/AI-written insights run in jobs and always show the underlying numbers.
- Opt-in for anything emailed or AI-generated.

**Jira:** UNT-69 (page v1), UNT-76 (daily brief), UNT-93 (AI weekly review).
