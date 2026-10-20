"use client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { notesMatching, previewOf, type ShowNote } from "@untitled/logic";
import { api } from "../../../../lib/api/client";
import { qk } from "../../../../lib/query/keys";
import ShownGroup, { ShownEmpty, ShownRow } from "./ShownGroup";

/** How many notes are read to search through; the cards show the best few. */
const SEARCH_POOL = 300;

/** The person's notes that match some words (or their latest notes when there are none). */
export default function NotesShown({ query }: { query?: string }) {
  const sb = useMemo(api, []);
  const q = useQuery({
    queryKey: qk.chatShow.notes,
    queryFn: async () => {
      const { data, error } = await sb
        .from("notes")
        .select("id,title,body,updated_at")
        .order("updated_at", { ascending: false })
        .limit(SEARCH_POOL);
      if (error) throw error;
      return data as ShowNote[];
    },
  });
  const { items, total } = notesMatching(q.data ?? [], query);
  const more = total - items.length;
  return (
    <ShownGroup
      tone="blue"
      icon={faPenToSquare}
      title={query ? `Notes · “${query}”` : "Latest notes"}
      openLabel="Open notes"
      openHref="/dashboard/notes"
      note={more > 0 ? `${more} more in your notes` : undefined}
    >
      {q.isPending && <ShownEmpty>Loading…</ShownEmpty>}
      {q.isError && <ShownEmpty>Couldn’t load your notes.</ShownEmpty>}
      {q.data && items.length === 0 && <ShownEmpty>No notes found.</ShownEmpty>}
      {items.map((n) => (
        <ShownRow key={n.id} href={`/dashboard/notes?note=${encodeURIComponent(n.id)}`} label={`Open note: ${n.title || "Untitled"}`}>
          <span className="line-clamp-1 text-[14.5px] font-medium">{n.title || "Untitled note"}</span>
          {n.body.trim() && <span className="line-clamp-2 text-[13px] text-fg-muted">{previewOf(n.body)}</span>}
        </ShownRow>
      ))}
    </ShownGroup>
  );
}
