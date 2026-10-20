import { emptyWidgetSnapshot, WIDGET_LAYOUT, WIDGET_LINKS, WIDGET_TEXT, type WidgetProps, type WidgetSnapshot } from "@untitled/logic";

import { SYNC_MIN_MS } from "./constants";
import { pushWidgets } from "./push";
import { loadWidgetSnapshot } from "./snapshot";
import { readWidgetProps, signatureOf, writeWidgetProps } from "./store";
import { widgetTheme } from "./theme";
import { isoDate } from "@/lib/dates";

let lastRun = 0;
let lastSignature = "";
let running: Promise<void> | null = null;

const propsFor = (snapshot: WidgetSnapshot): WidgetProps => ({
  snapshot,
  theme: widgetTheme,
  text: WIDGET_TEXT,
  links: WIDGET_LINKS,
  layout: WIDGET_LAYOUT,
});

async function deliver(props: WidgetProps, force: boolean) {
  const signature = signatureOf(props);
  // Nothing visible changed: don't redraw the widgets or touch storage.
  if (!force && signature === lastSignature) return;
  lastSignature = signature;
  await writeWidgetProps(props);
  await pushWidgets(props);
}

/**
 * Refreshes the home-screen widgets from the API. Called when the app opens or comes back to the foreground: it is skipped when the last
 * run was recent, runs one at a time, and only redraws the widgets when what they show actually changed.
 */
export function syncWidgets({ force = false }: { force?: boolean } = {}) {
  if (running) return running;
  if (!force && Date.now() - lastRun < SYNC_MIN_MS) return Promise.resolve();
  running = (async () => {
    try {
      lastRun = Date.now();
      const previous = await readWidgetProps();
      await deliver(propsFor(await loadWidgetSnapshot(previous?.snapshot ?? null)), force);
    } finally {
      running = null;
    }
  })();
  return running;
}

/** After signing out the widgets stop showing anything personal and ask to sign in. */
export async function clearWidgets() {
  lastRun = 0;
  await deliver(propsFor(emptyWidgetSnapshot(isoDate(), false)), true);
}
