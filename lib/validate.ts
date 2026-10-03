export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const clean = (v: unknown, max = 200) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";

export const pickMany = (v: unknown, allowed: readonly string[]) =>
  Array.isArray(v) ? Array.from(new Set(v.map((x) => clean(x, 60)).filter((x) => allowed.includes(x)))) : [];

export const pickOne = (v: unknown, allowed: readonly string[]) => {
  const s = clean(v, 60);
  return allowed.includes(s) ? s : "";
};

export const SURVEY = {
  roles: ["Student", "Professional", "Founder", "Freelancer", "Other"],
  tools: ["Notion", "Google Calendar", "Gmail", "Outlook", "Slack", "Apple Notes", "Evernote", "Todoist", "Other"],
  pains: ["Information is scattered", "Too many apps", "Hard to find things", "Meetings without follow-through", "Locked into one AI", "Privacy concerns", "Other"],
  features: ["Universal Search", "Context Graph", "Daily Brief", "Journal", "Notes", "Email", "Calendar", "Meetings", "Automations"],
  ai: ["Bring my own API key", "Use my existing AI account", "Pay as I go", "No AI, please", "Not sure yet"],
  pay: ["Yes", "Maybe", "No"],
  budget: ["Free only", "Under $5 / month", "$5–10 / month", "$10–20 / month", "$20+ / month"],
} as const;
