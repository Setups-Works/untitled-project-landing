# Releasing — the checklist for AI agents

Follow this when the user asks you to "make a release", "bump the version", "add the changelog and tag" or "push". It ties together the changelog, the version numbers, the GitHub tag and the push. The Android build itself is described in [RELEASING.md](RELEASING.md); the rules for everything else are in the root `AGENTS.md`.

**Ask before you guess:** if the user didn't say which version number, propose one (below) and say why. Don't invent product behaviour for the changelog; describe what you actually changed.

## 1. Pick the version

`MAJOR.MINOR.PATCH`, tags look like `v2.1.0`.

| Change                                                | Bump                      |
| ----------------------------------------------------- | ------------------------- |
| Bug fixes only                                        | patch (`2.0.0` → `2.0.1`) |
| New features, nothing that breaks existing use        | minor (`2.0.0` → `2.1.0`) |
| A big new product area, or a break people must notice | major (`2.0.0` → `3.0.0`) |

A tag with a suffix (`v2.1.0-beta.1`) is published as a pre-release and the app never offers it as an update.

## 2. Write the changelog entry

File: `apps/web/src/features/changelog/releases.ts`. Add **one new object at the top** of `RELEASES` (newest first):

```ts
{
  date: "2026-10-21",            // today, YYYY-MM-DD
  title: "Short name of the release",
  summary: "One sentence: what changed for people.",
  tone: "gold",                  // one of the eight tints: violet blue green amber clay mint gold sand
  appVersion: "v2.1.0",          // the git tag; links the entry to the GitHub Release. Leave out if no app build ships.
  changes: [
    { kind: "new", platform: "web", text: "…" },      // kind: new | improved | fixed   platform: web | app
  ],
},
```

- Write for people, not developers: what they can now do or what stopped being broken. One line each, sentence case, curly apostrophes (’), no emoji, no ticket numbers.
- One line per platform when the behaviour differs (a `web` line and an `app` line).
- Don't edit an older release's entry to add new things; add a new entry.
- `apps/web/tests/unit/changelog.test.ts` checks the shape.

## 3. Bump the version in all four places

They must be equal, and equal to the newest `appVersion` in the changelog (minus the `v`):

| File                       | Field          |
| -------------------------- | -------------- |
| `apps/mobile/app.json`     | `expo.version` |
| `apps/mobile/package.json` | `version`      |
| `apps/web/package.json`    | `version`      |
| `package.json` (repo root) | `version`      |

`apps/web/tests/unit/version-sync.test.ts` fails if one is left behind. The app's **Settings → About and updates** shows `expo.version`, and the in-app updater compares it with the latest GitHub Release. Don't touch `versionCode` or `versionName`: the release workflow sets them from the tag and the run number.

## 4. Check everything locally

```bash
corepack pnpm typecheck
corepack pnpm test
corepack pnpm --filter @untitled/logic test
corepack pnpm --filter @untitled/validation test
corepack pnpm check:design
corepack pnpm --filter mobile lint
corepack pnpm build:web
```

Fix failures; never skip a check or add `design-ok` to silence the design check. If the app's native setup changed (a new plugin, permission or native library), also run `pnpm --filter mobile exec expo prebuild --platform android --no-install` in a scratch copy and read the result; Android release builds fail on dependency clashes that only show up there (for example `Duplicate class androidx.work…`, fixed by `apps/mobile/plugins/withAndroidWorkRuntimeFix.js`).

## 5. Database migrations come first

Production migrations are **manual**: the deploy workflow does not run them.

- If you added files under `db/migrations/`, tell the user. They must be applied to the Azure database **before** the new web code is live, otherwise pages that ask for a new column or table fail (the 2.0.0 deploy broke the Journal this way until the migrations were applied).
- Apply with `DATABASE_URL=<production url> corepack pnpm db:migrate`. The Azure database's firewall only allows the web app, so the user adds a temporary rule for their IP first and removes it after. **Never change a firewall or other security setting yourself**; give the user the exact `az` command.
- Migrations are append-only and must be backward compatible with the previous app version (see `db/AGENTS.md`).

## 6. Commit, push, tag — in this order

Only commit and push when the user asked. Never commit `.env*`, keystores or build output.

```bash
git add -A
git commit -m "release: v2.1.0 — short summary

Co-Authored-By: <the attribution line the harness gives you>"
git push origin main                      # CI runs; web changes also trigger "Deploy web app to Azure"
git tag -a v2.1.0 -m "v2.1.0: short summary"
git push origin v2.1.0                    # starts "Release Android": builds, signs and publishes the APK
```

Push the commit **before** the tag so the tag points at what is on `main`. The user's rules decide whether to push to `main` directly or through a pull request; merging a PR needs the user (the sandbox blocks agents from merging unreviewed pull requests, and you shouldn't try to get around that).

## 7. Watch the runs

```bash
gh run list --limit 5          # CI, Deploy web app to Azure, Release Android
gh run view <id> --log-failed  # why a run failed
gh release view v2.1.0         # the APK and its .sha256 should be attached
```

- The Android build takes about 8–10 minutes. Until the release exists, the app's update check offers nothing.
- If **Release Android** fails and **no GitHub Release exists yet**, fix the cause, push the fix to `main`, and re-point the tag at the fixed commit (`git tag -f -a v2.1.0 -m "…" <commit>` then `git push -f origin v2.1.0`). **Ask the user first**: moving a published tag is a rewrite of shared history. Once a release has been published for a tag, never move it; ship a new patch version instead.
- Only cancel a run if the user asks (`gh run cancel <id>`).

## 8. What you must not do

- Don't tag a version that the four version files and the changelog don't agree on.
- Don't force-push `main`. Don't delete or reuse a tag that has a published release.
- Don't print or commit secrets (the `DATABASE_URL`, Azure keys, keystore). Read them from the environment or Azure app settings inside one command and never echo them.
- Don't say a release is "done" until `gh release view` shows the APK and the Azure deploy run is green.
