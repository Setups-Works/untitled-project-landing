/**
 * Personality insights worked out from what someone has actually written and done — journal entries, notes and tasks.
 * No AI and no quiz: these are simple, explainable measures (rates, streaks, habits, word choice), computed in the browser.
 */

export type InTask = { due_date: string | null; done: boolean; done_at: string | null; created_at: string; priority: number; list_id: string | null; cancelled: boolean; archived: boolean; recurrence: string | null };
export type InEntry = { entry_date: string; body: string; created_at: string };
export type InNote = { title: string; body: string; category: string; created_at: string; updated_at: string };

export type Axis = { key: string; label: string; value: number; why: string };
export type Observation = { icon: "check" | "clock" | "fire" | "pen" | "sun" | "tag" | "smile" | "calendar"; text: string };
export type Insights = {
  enough: boolean;
  name: string;
  summary: string;
  tags: string[];
  axes: Axis[];
  observations: Observation[];
  words: [string, number][];
};

const DAY = 86_400_000;
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);

const POSITIVE = new Set("good great happy love loved loving excited exciting grateful thankful proud calm win won enjoy enjoyed fun nice amazing glad hopeful relaxed progress success better best wonderful beautiful joy peaceful confident lucky thanks".split(" "));
const NEGATIVE = new Set("bad sad angry tired stressed stress anxious worried worry hate awful upset frustrated frustrating lonely overwhelmed fail failed failing worse worst pain sick exhausted afraid scared annoyed guilty".split(" "));
const STOP = new Set("about after again also always because been before being between both came come could does doing done dont down each even every from going good have having here into just know like made make many more most much must need never only other over really right same should since some still such take than that their them then there these they thing things think this those through today very want well were what when where which while will with would your youre ive its im its got get getting day days time week feel felt lot one two three".split(" "));

const words = (s: string) => s.toLowerCase().match(/[a-z']{3,}/g) ?? [];
const count = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
const dayKey = (iso: string) => iso.slice(0, 10);
const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const ARCHETYPES: Record<string, { name: string; tags: [string, string]; line: string }> = {
  planner: { name: "The Planner", tags: ["Forward-looking", "Structured"], line: "You like knowing what’s coming — your tasks have dates, priorities and homes." },
  finisher: { name: "The Finisher", tags: ["Driven", "Reliable"], line: "You close the loop. Most of what you start gets checked off." },
  reflective: { name: "The Reflector", tags: ["Thoughtful", "Self-aware"], line: "You make space to think things through, and your journal shows it." },
  creative: { name: "The Creator", tags: ["Curious", "Imaginative"], line: "Ideas find their way into your notes — you capture more than you plan." },
  expressive: { name: "The Storyteller", tags: ["Articulate", "Open"], line: "You put a lot into words, and you write plenty." },
  organised: { name: "The Organiser", tags: ["Orderly", "Systematic"], line: "You sort things into lists, categories and routines." },
  consistent: { name: "The Steady One", tags: ["Consistent", "Dependable"], line: "You show up regularly. Small, steady habits are your thing." },
  positive: { name: "The Optimist", tags: ["Upbeat", "Grateful"], line: "Your writing leans towards what’s going well." },
};

export function analyse(tasks: InTask[], entries: InEntry[], notes: InNote[], now = new Date()): Insights {
  const live = tasks.filter((t) => !t.cancelled && !t.archived);
  const total = live.length + entries.length + notes.length;
  const empty: Insights = { enough: false, name: "", summary: "", tags: [], axes: [], observations: [], words: [] };
  if (total < 3) return empty;

  const today = localDay(now);
  const since = (days: number) => localDay(new Date(now.getTime() - days * DAY));
  const d30 = since(30), d60 = since(60);

  /* --- tasks --- */
  const done = live.filter((t) => t.done);
  const dated = live.filter((t) => t.due_date);
  const withDue = done.filter((t) => t.due_date && t.done_at);
  const onTime = withDue.filter((t) => localDay(new Date(t.done_at!)) <= t.due_date!);
  const overdue = live.filter((t) => !t.done && t.due_date && t.due_date < today);
  const prioritised = live.filter((t) => t.priority < 4);

  /* --- writing --- */
  const entries30 = entries.filter((e) => e.entry_date >= d30);
  const notes30 = notes.filter((n) => dayKey(localDay(new Date(n.created_at))) >= d30);
  const journalDays30 = new Set(entries30.map((e) => e.entry_date)).size;
  const written30 = entries30.reduce((a, e) => a + count(e.body), 0) + notes30.reduce((a, n) => a + count(n.title) + count(n.body), 0);
  const creative = notes.filter((n) => n.category === "Ideas & Creativity").length;
  const categories = new Set(notes.map((n) => n.category)).size;
  const lists = new Set(live.map((t) => t.list_id).filter(Boolean)).size;

  /* --- activity days (any journal entry, note edit or completed task) --- */
  const active = new Set<string>();
  entries.forEach((e) => active.add(e.entry_date));
  notes.forEach((n) => active.add(localDay(new Date(n.updated_at))));
  done.forEach((t) => t.done_at && active.add(localDay(new Date(t.done_at))));
  const active30 = [...active].filter((d) => d >= d30 && d <= today).length;
  let streak = 0;
  for (let i = active.has(today) ? 0 : 1; i < 400; i++) {
    if (active.has(localDay(new Date(now.getTime() - i * DAY)))) streak++;
    else break;
  }

  /* --- sentiment & words (last 60 days of writing) --- */
  const recentText = [...entries.filter((e) => e.entry_date >= d60).map((e) => e.body), ...notes.filter((n) => localDay(new Date(n.updated_at)) >= d60).map((n) => `${n.title} ${n.body}`)].join("\n");
  let pos = 0, neg = 0;
  const freq = new Map<string, number>();
  for (const w of words(recentText)) {
    if (POSITIVE.has(w)) pos++;
    if (NEGATIVE.has(w)) neg++;
    if (w.length >= 4 && !STOP.has(w) && !POSITIVE.has(w) && !NEGATIVE.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
  }
  const topWords = [...freq.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  const tone = pos + neg;

  /* --- the eight measures --- */
  const axes: Axis[] = [
    { key: "planner", label: "Planner", value: clamp(pct(dated.length, live.length) * 0.6 + pct(prioritised.length, live.length) * 0.25 + (lists ? 15 : 0)), why: "Tasks with dates, priorities and lists" },
    { key: "finisher", label: "Finisher", value: clamp(pct(done.length, live.length)), why: "Share of your tasks that are done" },
    { key: "reflective", label: "Reflective", value: clamp((journalDays30 / 12) * 100), why: "Days you journalled in the last 30" },
    { key: "creative", label: "Creative", value: clamp((notes30.length / 8) * 70 + (creative ? 30 : 0)), why: "Notes captured, and ideas filed" },
    { key: "expressive", label: "Expressive", value: clamp((written30 / 1500) * 100), why: "Words written in the last 30 days" },
    { key: "organised", label: "Organised", value: clamp((categories / 4) * 50 + (lists ? 25 : 0) + (live.some((t) => t.recurrence) ? 25 : 0)), why: "Categories, lists and routines" },
    { key: "consistent", label: "Consistent", value: clamp((active30 / 20) * 100), why: "Active days in the last 30" },
    { key: "positive", label: "Positive", value: tone >= 3 ? clamp(pct(pos, tone)) : 0, why: "Tone of your recent writing" },
  ];

  const ranked = [...axes].sort((a, b) => b.value - a.value);
  const top = ranked[0].value > 0 ? ranked[0] : null;
  const arch = ARCHETYPES[top?.key ?? "consistent"];

  /* --- plain-language observations --- */
  const obs: Observation[] = [];
  if (live.length >= 3) obs.push({ icon: "check", text: `You’ve completed ${done.length} of ${live.length} tasks (${Math.round(pct(done.length, live.length))}%).` });
  if (withDue.length >= 3) obs.push({ icon: "clock", text: `${Math.round(pct(onTime.length, withDue.length))}% of your finished tasks were done by their due date.` });
  if (overdue.length) obs.push({ icon: "calendar", text: `${overdue.length} ${overdue.length === 1 ? "task is" : "tasks are"} overdue right now.` });
  const byWeekday = [0, 0, 0, 0, 0, 0, 0];
  done.forEach((t) => t.done_at && byWeekday[new Date(t.done_at).getDay()]++);
  const best = byWeekday.indexOf(Math.max(...byWeekday));
  if (done.length >= 5 && byWeekday[best] > 1) obs.push({ icon: "calendar", text: `${new Date(2024, 0, 7 + best).toLocaleDateString(undefined, { weekday: "long" })} is your most productive day.` });
  if (streak >= 2) obs.push({ icon: "fire", text: `You’re on a ${streak}-day streak of journalling, writing or finishing tasks.` });
  if (journalDays30) obs.push({ icon: "pen", text: `You journalled on ${journalDays30} of the last 30 days.` });
  if (written30 >= 50) obs.push({ icon: "pen", text: `You’ve written about ${written30.toLocaleString()} words in the last 30 days.` });
  const hours = [...entries.map((e) => new Date(e.created_at).getHours()), ...notes.map((n) => new Date(n.created_at).getHours())];
  if (hours.length >= 5) {
    const bucket = (h: number) => (h >= 5 && h < 12 ? "mornings" : h >= 12 && h < 17 ? "afternoons" : h >= 17 && h < 22 ? "evenings" : "late at night");
    const tally = new Map<string, number>();
    hours.forEach((h) => tally.set(bucket(h), (tally.get(bucket(h)) || 0) + 1));
    obs.push({ icon: "sun", text: `You do most of your writing in the ${[...tally.entries()].sort((a, b) => b[1] - a[1])[0][0]}.`.replace("in the late at night", "late at night") });
  }
  if (notes.length >= 3) {
    const cat = new Map<string, number>();
    notes.forEach((n) => cat.set(n.category, (cat.get(n.category) || 0) + 1));
    const [name, n] = [...cat.entries()].sort((a, b) => b[1] - a[1])[0];
    obs.push({ icon: "tag", text: `Most of your notes (${n}) are filed under “${name}”.` });
  }
  if (tone >= 6) obs.push({ icon: "smile", text: pos > neg * 1.5 ? "Your recent writing leans positive." : neg > pos * 1.5 ? "Your recent writing has been on the heavier side — worth noticing." : "Your recent writing is a balanced mix of highs and lows." });

  return { enough: true, name: arch.name, summary: arch.line, tags: [...arch.tags], axes, observations: obs.slice(0, 7), words: topWords };
}
