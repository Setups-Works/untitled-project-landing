import type { WidgetProps } from "@untitled/logic";

/** Widgets exist only on iOS and Android; everywhere else (web, tests) there is nothing to update. The platform files do the work. */
export async function pushWidgets(_props: WidgetProps): Promise<void> {}
