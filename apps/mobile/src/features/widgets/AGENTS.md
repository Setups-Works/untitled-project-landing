# features/widgets (app)

**Does:** four home-screen widgets on iOS (WidgetKit via `expo-widgets`) and Android (App Widgets via `react-native-android-widget`): **Today's tasks**, **Quick write** (journal / note / task), **Health today**, **Journal** (latest entry + streak). **Needs a development or release build** (not Expo Go): `pnpm --filter mobile exec expo run:ios|android`.

**How it works:** widgets never hold a login. The app builds one small snapshot and hands it over; the widgets only draw it.

```
features/widgets/
  constants.ts      sync throttle, storage key
  theme.ts          the widgets' colours, built from the app's design tokens
  snapshot.ts       reads tasks, journal and health in parallel → buildWidgetSnapshot (packages/logic); a failed part keeps its old figures
  store.ts          the last props, saved so Android's background renderer needs no network; signatureOf() for change detection
  sync.ts           syncWidgets() (throttled, one at a time, only redraws when something visible changed) · clearWidgets() on sign-out
  useWidgetSync.ts  mount once (app/_layout.tsx): sync on sign-in and when the app returns to the foreground
  push.ts           no-op for web/tests · push.ios.ts · push.android.ts: platform delivery
  ios/              one file per widget, each a self-contained 'widget' component (isolated runtime, props only)
  android/          one file per widget + primitives.tsx + index.tsx (handler registration, redraw)
```

**Shared code** (`packages/logic/src/widgets.ts`): the snapshot type and builder, `WIDGET_NAMES`, `WIDGET_LINKS` (taps open the app by its `untitled://` scheme), `WIDGET_TEXT` (every word), `WIDGET_LAYOUT` (rows, type sizes, spacing), `WIDGET_LIMITS`, and the `WidgetProps` both platforms receive (snapshot + theme + text + links + layout). Nothing is typed twice.

**Rules**

- **No hard-coding.** A widget can't import the app's tokens, so colours, words, sizes and links arrive in its props. iOS widget functions must be pure and reference nothing outside themselves (see the Expo docs' `'widget'` directive).
- Add a widget in four places and keep them equal: `WIDGET_NAMES`, `ios/`, `android/index.tsx` (`DRAW`), and `app.json` (both `expo-widgets` and `react-native-android-widget` lists). `apps/web/tests/unit/widget-config.test.ts` fails if they disagree.
- Android runs the handler in the background with the app closed: `apps/mobile/index.ts` registers it at startup; it draws only from the stored props.
- Never put personal text in a widget beyond what the person sees on that screen of the app; sign-out wipes them (`clearWidgets`). Widget refreshes are throttled (`SYNC_MIN_MS`) and skipped when nothing changed.
- Deep links used: `/todo`, `/health`, `/journal`, `/journal?new=1`, `/note/new`, `/task/new`.
