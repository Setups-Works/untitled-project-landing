# features/home (app)

**Does:** the Home screen (streak, today's tasks, notes, today's journal, personality insights). The sections can be rearranged: **touch and hold a section, then drag it up or down**. The order is saved per account on the phone (`AsyncStorage`, key `home-layout:<user id>`).

**Files:** `HomeScreen.tsx` (builds a `sections` map and hands it to `ReorderableList`) · `useHomeOrder.ts` (`HOME_SECTIONS` default order, load and save) · `components/ui/ReorderableList.tsx` (the drag: `react-native-gesture-handler` pan after a 320 ms hold + `react-native-reanimated`; no new dependency). Cleaning and moving the order is `packages/logic/src/homeLayout.ts`, shared with the web.

**Rules**

- Add a section: add its id to `HOME_SECTIONS` and an entry to `sections` in `HomeScreen`; saved orders pick it up at the end.
- A section whose node is `null` is skipped (the `plans` card is `null` once a plan is chosen).
- The hold-to-drag keeps normal scrolling and taps working; do not replace it with an immediate pan.
- Honour "Reduce motion" (the rows skip their slide animation).
- There is no auto-scroll while dragging near the screen edge yet. Not yet verified on a physical device: try it on iOS and Android after changing the list.
