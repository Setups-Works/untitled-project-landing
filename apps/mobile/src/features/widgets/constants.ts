/** Fewest milliseconds between two syncs from foreground changes; widgets don't need fresher data than this, and it saves the network. */
export const SYNC_MIN_MS = 5 * 60 * 1000;

/** Where the latest widget props are kept on the phone, so Android's background renderer can draw without any network. */
export const WIDGET_STORE_KEY = "widgets:props:v1";
