import type { WidgetProps } from "@untitled/logic";

import HealthWidget from "./HealthWidget";
import JournalWidget from "./JournalWidget";
import QuickWidget from "./QuickWidget";
import TasksWidget from "./TasksWidget";

/** Every iOS widget, so a sync can update them all. */
export const IOS_WIDGETS = [TasksWidget, QuickWidget, HealthWidget, JournalWidget];

/** Hands the same props to every iOS widget; WidgetKit redraws them. */
export function updateIosWidgets(props: WidgetProps) {
  for (const widget of IOS_WIDGETS) widget.updateSnapshot(props);
}
