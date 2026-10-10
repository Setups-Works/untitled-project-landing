import { Suspense } from "react";
import ClientOnly from "../../../components/app/ClientOnly";
import CalendarApp from "../../../features/calendar/components/CalendarApp";

export const metadata = {
  title: "Calendar — untitled project",
  description: "Month, week, day, and agenda views of your events and tasks.",
};

export default function CalendarPage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div className="p-6 text-xs text-fg-muted">Loading calendar...</div>}>
        <CalendarApp />
      </Suspense>
    </ClientOnly>
  );
}
