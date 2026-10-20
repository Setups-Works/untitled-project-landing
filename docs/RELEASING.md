# Releasing the Android app

A version tag builds the app and publishes the APK as a GitHub Release. Nothing is built or uploaded by hand.

```bash
git checkout main && git pull
git tag -a v1.2.0 -m "v1.2.0: what changed"
git push origin v1.2.0
gh run watch                       # follow the "Release Android" workflow
gh release view v1.2.0             # the APK and its .sha256 are attached
```

Re-run an existing tag (for example after changing a repository setting): Actions → **Release Android** → Run workflow → enter the tag, or `gh workflow run release-android.yml -f tag=v1.2.0`.

Tags must look like `v1.2.3`. A tag with a suffix (`v1.2.3-beta.1`) is published as a pre-release.

## How people get the update

On Android the app asks GitHub for the latest release each time it opens, and **Settings → About and updates → Check for updates** asks on demand (`apps/mobile/src/features/updates`). If the tag is newer than the installed version, a sheet offers **Update now**: the app downloads the APK itself with a progress bar and then opens Android's installer (the first time, Android asks to allow installs from the app, which needs `REQUEST_INSTALL_PACKAGES`). If the download fails there is a "Download in the browser" fallback. That works because every build is signed with the same key and `versionCode` rises with each run. Pre-releases, drafts and releases without an `.apk` are never offered. The first build that contains this check is v1.0.2; earlier installs have to be updated by hand once.

Add a line to the web changelog (`apps/web/src/features/changelog/releases.ts`) in the same change as the tag.

## What the workflow does (`.github/workflows/release-android.yml`)

1. Generates `apps/mobile/android` with `expo prebuild` (that folder is never committed).
2. Sets `versionName` from the tag and `versionCode` from the run number, so a newer APK always installs over an older one.
3. Builds `assembleRelease`, signs it, names it `untitled-project-<tag>.apk` and writes a SHA-256 file.
4. Creates (or updates) the release for the tag with auto-generated notes.

## Settings (repository → Settings → Secrets and variables → Actions)

| Name                                                                                                | Kind     | Purpose                                                                  |
| --------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| `EXPO_PUBLIC_API_URL`                                                                               | variable | The web app's address, compiled into the app. Required.                  |
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | secrets  | Optional release key. Without them the APK is signed with the debug key. |

A debug-signed APK installs on any phone (allow installs from the browser or Files app) but cannot be uploaded to Google Play. To sign properly, create a keystore once and store it as secrets:

```bash
keytool -genkeypair -v -keystore release.keystore -alias untitled -keyalg RSA -keysize 2048 -validity 10000
base64 -i release.keystore | gh secret set ANDROID_KEYSTORE_BASE64
gh secret set ANDROID_KEYSTORE_PASSWORD
gh secret set ANDROID_KEY_ALIAS --body untitled
gh secret set ANDROID_KEY_PASSWORD
```

Keep `release.keystore` somewhere safe and never commit it: every future update must be signed with the same key.
