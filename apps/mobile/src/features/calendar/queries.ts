import { useQuery } from "@tanstack/react-query";
import type { CalendarEvent } from "@untitled/types";

import { dbQuery } from "@/features/chat/db";
import { qk } from "@/lib/queryKeys";

const COLS = "id,title,description,location,start_at,end_at,all_day,color";

/** The same read the web Calendar makes (/api/v1/db, row-level security), oldest first. */
export function useCalendarEvents() {
  return useQuery({
    queryKey: qk.calendar,
    queryFn: async () =>
      (await dbQuery<CalendarEvent[]>({
        table: "calendar_events",
        op: "select",
        columns: COLS,
        order: [{ column: "start_at", ascending: true }],
        limit: 5000,
      })) ?? [],
  });
}
