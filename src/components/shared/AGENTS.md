# src/components/shared

**Purpose:** Small composites used by two or more features: `EmptyState`, `Avatar`, `AttachmentList` (images/audio/files with signed URLs), `MarkdownView` (today `components/app/Markdown.tsx`), `Pill`/`Chip`, `LocalTime`. **Owner:** whoever first needs the second copy. **Jira:** UNT-50, UNT-67.

## Rules

- Extract here only when a second feature needs it; until then keep it in the feature (avoid speculative abstractions).
- Never fetch data here. Markdown rendering must never use `dangerouslySetInnerHTML`; links allow only `http(s)` with `rel="noopener noreferrer"`.
