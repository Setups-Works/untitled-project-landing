/**
 * Drafts: what a person has typed, attached or recorded but not sent yet, kept in this browser so a refresh or an accidental
 * tab close doesn't lose it. Text lives in localStorage; files and voice recordings (Blobs) live in IndexedDB.
 * Everything here fails quietly (private windows, blocked storage) — drafts are a convenience, never a requirement.
 * Drafts are wiped on sign-out so the next person on a shared computer never sees them.
 */
const PREFIX = "up_draft:";
const DB_NAME = "up_drafts";
const STORE = "files";

export function readText(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writeText(key: string, value: string) {
  try {
    if (value) window.localStorage.setItem(PREFIX + key, value);
    else window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* storage unavailable or full */
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const r = run(t.objectStore(STORE));
      t.oncomplete = () => resolve(r.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  } finally {
    db.close();
  }
}

export async function readFiles(key: string): Promise<File[]> {
  try {
    const v = await tx<File[] | undefined>("readonly", (s) => s.get(key));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export async function writeFiles(key: string, files: File[]) {
  try {
    if (files.length) await tx("readwrite", (s) => s.put(files, key));
    else await tx("readwrite", (s) => s.delete(key));
  } catch {
    /* quota exceeded or storage blocked */
  }
}

/** Removes every draft (text and files). Called when someone signs out. */
export async function clearDrafts() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  try {
    await tx("readwrite", (s) => s.clear());
  } catch {
    /* ignore */
  }
}
