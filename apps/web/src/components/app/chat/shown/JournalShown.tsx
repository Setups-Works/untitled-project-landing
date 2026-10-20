"use client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { dayLabel, previewOf, SHOW_LIMITS } from "@untitled/logic";
import { api } from "../../../../lib/api/client";
import { isoDate } from "../../../../lib/dates";
import { fmtTime } from "../../../../lib/prefs";
import { qk } from "../../../../lib/query/keys";
import ShownGroup, { ShownEmpty, ShownRow } from "./ShownGroup";

type Row = { id: string; body: string; created_at: string; attachments: unknown[] };

/** The journal entries written on one day, read from the signed-in person's own journal. */
export default function JournalShown({ date }: { date: string }) {
  const sb = useMemo(api, []);
  const today = isoDate();
  const q = useQuery({
    queryKey: qk.chatShow.journal(date),
    queryFn: async () => {
      const { data, error } = await sb
        .from("journal_entries")
        .select("id,body,created_at,attachments")
        .eq("entry_date", date)
        .order("created_at")
        .limit(SHOW_LIMITS.items);
      if (error) throw error;
      return data as Row[];
    },
  });
  const href = `/dashboard/journal?d=${date}`;
  const rows = q.data ?? [];
  return (
    <ShownGroup tone="violet" icon={faBookOpen} title={`Journal · ${dayLabel(date, today)}`} openLabel="Open journal" openHref={href}>
      {q.isPending && <ShownEmpty>Loading…</ShownEmpty>}
      {q.isError && <ShownEmpty>Couldn’t load your journal.</ShownEmpty>}
      {q.data && rows.length === 0 && <ShownEmpty>No entries on this day.</ShownEmpty>}
      {rows.map((e) => (
        <ShownRow key={e.id} href={href} label={`Open journal entry at ${fmtTime(e.created_at)}`}>
          <span className="text-[12px] text-fg-subtle">
            {fmtTime(e.created_at)}
            {e.attachments.length > 0 ? ` · ${e.attachments.length} ${e.attachments.length === 1 ? "file" : "files"}` : ""}
          </span>
          <span className="line-clamp-3 text-[14.5px]">{previewOf(e.body) || "Attachment only"}</span>
        </ShownRow>
      ))}
    </ShownGroup>
  );
}
