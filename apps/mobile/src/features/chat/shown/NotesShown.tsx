import { notesMatching, previewOf } from "@untitled/logic";
import { router } from "expo-router";

import { ShownEmpty, ShownGroup, ShownRow } from "./ShownGroup";
import { AppText } from "@/components/ui/AppText";
import { useNotes } from "@/features/notes/queries";

/** The person's notes that match some words (or their latest notes when there are none). */
export function NotesShown({ query }: { query?: string }) {
  const q = useNotes();
  const { items, total } = notesMatching(q.data ?? [], query);
  const more = total - items.length;
  return (
    <ShownGroup
      tone="blue"
      icon="pen-to-square"
      title={query ? `Notes · “${query}”` : "Latest notes"}
      openLabel="Open notes"
      onOpen={() => router.navigate("/notes")}
      note={more > 0 ? `${more} more in your notes` : undefined}
    >
      {q.isPending ? <ShownEmpty>Loading…</ShownEmpty> : null}
      {q.isError ? <ShownEmpty>Couldn’t load your notes.</ShownEmpty> : null}
      {q.data && items.length === 0 ? <ShownEmpty>No notes found.</ShownEmpty> : null}
      {items.map((n) => (
        <ShownRow
          key={n.id}
          label={`Open note: ${n.title || "Untitled"}`}
          onPress={() => router.push({ pathname: "/note/[id]", params: { id: n.id } })}
        >
          <AppText variant="bodyStrong" numberOfLines={1}>
            {n.title || "Untitled note"}
          </AppText>
          {n.body.trim() ? (
            <AppText variant="small" numberOfLines={2}>
              {previewOf(n.body)}
            </AppText>
          ) : null}
        </ShownRow>
      ))}
    </ShownGroup>
  );
}
