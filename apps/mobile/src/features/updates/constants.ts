/** How long to wait for GitHub before giving up on a version check. */
export const CHECK_TIMEOUT_MS = 8000;

/** Where the downloaded APK is kept until the installer has it (the cache, which the system may clear). */
export const APK_FILE_NAME = "untitled-project-update.apk";

/** What Android is told about the file: the type of an app package, and that the installer may read it (FLAG_GRANT_READ_URI_PERMISSION). */
export const APK_MIME = "application/vnd.android.package-archive";
export const INSTALL_ACTION = "android.intent.action.VIEW";
export const FLAG_GRANT_READ_URI_PERMISSION = 1;
