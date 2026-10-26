# features/home

**Does:** drag-to-reorder for the cards on Home (`components/app/HomeView.tsx`). Each column (`main`, `side`) keeps its own order, saved in this browser under `up_home_layout` (not in the database: it is a per-device layout, so no migration).

**Files:** `useHomeLayout.ts` (the order, saving, pointer drag, arrow-key moves) · `DragHandle.tsx` (the grip). The pure part — cleaning a saved order against the cards that exist and moving an item — is `packages/logic/src/homeLayout.ts` (tested), shared with the phone app.

**How it works:** a card swaps with its neighbour when the pointer passes the neighbour's midpoint (never on mere overlap, so a tall card can't make two cards swap back and forth). The handle is a real `<button>` with `touch-none`; focus it and press ↑ / ↓ to move a card without a pointer.

**Rules**

- Add a card: put its id in `HOME_COLUMNS` and add it to the `cards` map in `HomeView`; old saved orders pick it up at the end automatically (`cleanOrder`). A card that renders `null` (like invitations when there are none) is skipped but keeps its place.
- Each card's wrapper needs `data-drag-id` (HomeView's `column()` adds it); the column needs `data-home-col`.
- No auto-scroll while dragging near the screen edge yet.
- Phone app equivalent: `apps/mobile/src/features/home` + `components/ui/ReorderableList.tsx` (touch and hold, then drag).
