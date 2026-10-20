"use client";
import type { ShowItem } from "../../../../lib/chat-actions";
import HealthShown from "./HealthShown";
import JournalShown from "./JournalShown";
import NotesShown from "./NotesShown";
import TasksShown from "./TasksShown";

/**
 * The cards a chat reply asked for with `<show-item>` blocks. The assistant only names what to show; each card reads the real items
 * from the signed-in person's own data (row-level security applies), so nothing is invented and nothing leaves the app.
 */
export default function ShownItems({ shows }: { shows: ShowItem[] }) {
  return (
    <div role="group" aria-label="Items from your workspace">
      {shows.map((s, i) => {
        switch (s.kind) {
          case "journal":
            return <JournalShown key={i} date={s.date} />;
          case "tasks":
            return <TasksShown key={i} scope={s.scope} />;
          case "notes":
            return <NotesShown key={i} query={s.query} />;
          case "health":
            return <HealthShown key={i} date={s.date} />;
        }
      })}
    </div>
  );
}
