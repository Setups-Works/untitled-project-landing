import app from "../../app.json";

/**
 * The app's version, read from app.json when the app is bundled, so it always matches the code that is running. The native build's own
 * version can lag behind during development (an old dev build keeps reporting the version it was built with). Release builds are
 * tagged with the same number (docs/RELEASING.md), so the two agree there.
 */
export const APP_VERSION: string = app.expo.version;
