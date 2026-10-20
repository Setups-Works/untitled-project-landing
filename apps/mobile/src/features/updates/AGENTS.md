# features/updates (app)

**Does:** keeps the Android app current from GitHub Releases, without the Play Store. Checks once per launch and on request, then downloads the APK inside the app and opens Android's installer. iOS updates come from the store, so nothing is offered there.

```
features/updates/
  constants.ts       timeouts, file name, the Android install intent values
  github.ts          fetchLatestRelease(): the newest stable release with an .apk (parsing and version rules: packages/logic/src/updates.ts)
  download.ts        downloadApk() with progress and cancel · installApk() hands the file to the installer
  UpdateProvider.tsx state machine (idle → checking → available → downloading → installing | error) + useUpdate() for Settings
  UpdateSheet.tsx    the sheet: what's new, progress bar, retry, browser fallback
```

**Rules**

- Only downloads from `https://github.com/` and only stable releases; the phone itself verifies the APK: it must be signed with the same key and have a higher `versionCode` (see `docs/RELEASING.md`).
- The check never throws and never shows anything on failure unless the person asked (the Settings button).
- Needs `android.permission.REQUEST_INSTALL_PACKAGES` (app.json) and a native build; in Expo Go there is no release to update.
