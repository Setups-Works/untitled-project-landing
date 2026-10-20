import { WIDGET_NAMES, type WidgetProps } from "@untitled/logic";
import { registerWidgetTaskHandler, requestWidgetUpdate, type WidgetTaskHandlerProps } from "react-native-android-widget";
import type { ReactElement } from "react";

import { readWidgetProps } from "../store";
import { HealthWidget } from "./HealthWidget";
import { JournalWidget } from "./JournalWidget";
import { QuickWidget } from "./QuickWidget";
import { TasksWidget } from "./TasksWidget";
import type { WidgetSize } from "./primitives";

type Draw = (props: WidgetProps, size: WidgetSize) => ReactElement;

/** Android widgets by the name registered in app.json (WIDGET_NAMES): how to draw each one. */
const DRAW: Record<string, Draw> = {
  [WIDGET_NAMES.tasks]: (props, size) => <TasksWidget props={props} size={size} />,
  [WIDGET_NAMES.quick]: (props, size) => <QuickWidget props={props} size={size} />,
  [WIDGET_NAMES.health]: (props, size) => <HealthWidget props={props} size={size} />,
  [WIDGET_NAMES.journal]: (props, size) => <JournalWidget props={props} size={size} />,
};

/**
 * Runs when Android adds, resizes or periodically refreshes a widget, with no screen and often with the app closed: it draws from the
 * props the app last saved, so it needs no network and holds no login.
 */
async function widgetTaskHandler({ widgetInfo, widgetAction, renderWidget }: WidgetTaskHandlerProps) {
  const draw = DRAW[widgetInfo.widgetName];
  if (!draw || widgetAction === "WIDGET_DELETED" || widgetAction === "WIDGET_CLICK") return;
  const props = await readWidgetProps();
  if (props) renderWidget(draw(props, { width: widgetInfo.width, height: widgetInfo.height }));
}

/** Call once at startup (see apps/mobile/index.ts) so Android can reach the handler even when the app isn't open. */
export const registerAndroidWidgets = () => registerWidgetTaskHandler(widgetTaskHandler);

/** Redraws every widget on the home screen from fresh props. */
export async function updateAndroidWidgets(props: WidgetProps) {
  await Promise.all(
    Object.entries(DRAW).map(([widgetName, draw]) =>
      requestWidgetUpdate({ widgetName, renderWidget: (info) => draw(props, { width: info.width, height: info.height }) }),
    ),
  );
}
