/** Rules for files attached to notes, journal entries and chats. Mirrors the "note-files" bucket limits in apps/web/src/server/storage.ts. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** A file name that is safe inside a storage key. */
export const safeName = (n: string) => n.replace(/[^\w.\- ]+/g, "_").slice(0, 80) || "file";
