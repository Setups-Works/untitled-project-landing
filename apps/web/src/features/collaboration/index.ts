/** The feature's public surface: other code imports from here, never from its internals. */
export { default as CollaborationApp } from "./components/CollaborationApp";
export { default as SharedJournalApp } from "./components/SharedJournalApp";
export { useCollaborationRealtime, useMyInvites } from "./hooks/useSharedJournals";
export type * from "./types";
