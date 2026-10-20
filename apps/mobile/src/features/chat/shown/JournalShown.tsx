import { dayLabel, previewOf, SHOW_LIMITS } from "@untitled/logic";
import { router } from "expo-router";

import { ShownEmpty, ShownGroup, ShownRow } from "./ShownGroup";
import { AppText } from "@/components/ui/AppText";
import { Palette } from "@/constants/theme";
import { useJournalDay } from "@/features/journal/queries";
import { isoDate, timeOf } from "@/lib/dates";

/** The journal entries written on one day, read from the signed-in person's own journal. */
export function JournalShown({ date }: { date: string }) {
  const q = useJournalDay(date);
  const entries = (q.data ?? []).slice(0, SHOW_LIMITS.items);
  return (
    <ShownGroup
      tone="violet"
      icon="book-open"
      title={`Journal · ${dayLabel(date, isoDate())}`}
      openLabel="Open journal"
      onOpen={() => router.navigate("/journal")}
    >
      {q.isPending ? <ShownEmpty>Loading…</ShownEmpty> : null}
      {q.isError ? <ShownEmpty>Couldn’t load your journal.</ShownEmpty> : null}
      {q.data && entries.length === 0 ? <ShownEmpty>No entries on this day.</ShownEmpty> : null}
      {entries.map((e) => (
        <ShownRow
          key={e.id}
          label={`Open journal entry at ${timeOf(e.created_at)}`}
          onPress={() => router.push({ pathname: "/journal/[id]", params: { id: e.id } })}
        >
          <AppText variant="small" color={Palette.fgSubtle}>
            {timeOf(e.created_at)}
            {e.attachments.length ? ` · ${e.attachments.length} ${e.attachments.length === 1 ? "file" : "files"}` : ""}
          </AppText>
          <AppText variant="body" numberOfLines={3}>
            {previewOf(e.body) || "Attachment only"}
          </AppText>
        </ShownRow>
      ))}
    </ShownGroup>
  );
}
