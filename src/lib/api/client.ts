import { makeFrom, type Result, type Spec } from "./builder";

/** Runs a query spec through the app's own API; the server applies the signed-in user's permissions. */
async function run(spec: Spec): Promise<Result<unknown>> {
  try {
    const res = await fetch("/api/v1/db", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(spec),
      credentials: "same-origin",
    });
    if (res.status === 401) return { data: null, count: null, error: { message: "Please sign in again.", code: "401" } };
    return (await res.json()) as Result<unknown>;
  } catch {
    return { data: null, count: null, error: { message: "Network error. Check your connection and try again." } };
  }
}

type Signed = { path: string; signedUrl: string | null; error: string | null };
const post = async <T>(url: string, body: unknown): Promise<{ data: T | null; error: { message: string } | null }> => {
  try {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = (await res.json().catch(() => ({}))) as { data?: T; error?: string };
    return res.ok ? { data: (j.data ?? null) as T | null, error: null } : { data: null, error: { message: j.error ?? "Request failed." } };
  } catch {
    return { data: null, error: { message: "Network error." } };
  }
};

/** File storage for one bucket. Paths always start with the signed-in user's id. */
function bucket(name: string) {
  return {
    async upload(path: string, file: Blob, opts?: { contentType?: string }) {
      try {
        const res = await fetch(`/api/v1/storage/o/${name}/${path.split("/").map(encodeURIComponent).join("/")}`, {
          method: "PUT",
          headers: { "content-type": opts?.contentType || file.type || "application/octet-stream" },
          body: file,
        });
        if (res.ok) return { error: null };
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        return { error: { message: j.error ?? "Upload failed." } };
      } catch {
        return { error: { message: "Network error." } };
      }
    },
    remove: async (paths: string[]) => ({ error: (await post(`/api/v1/storage/remove`, { bucket: name, paths })).error }),
    /** Deletes every file under a folder you own, e.g. `${userId}/journal`. */
    removeFolder: async (prefix: string) => ({ error: (await post(`/api/v1/storage/remove`, { bucket: name, prefix })).error }),
    createSignedUrls: (paths: string[], ttl = 3600) => post<Signed[]>(`/api/v1/storage/sign`, { bucket: name, paths, ttl }),
    /** Avatars are public; this is just the path the server serves them from. */
    getPublicUrl: (path: string) => ({
      data: { publicUrl: `/api/v1/storage/o/${name}/${path.split("/").map(encodeURIComponent).join("/")}` },
    }),
  };
}

let me: Promise<string | null> | null = null;
/** The signed-in user's id (needed to build storage paths). Cached for the life of the page. */
const getUser = () => {
  me ??= fetch("/api/auth/get-session", { credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : null))
    .then((s: { user?: { id?: string } } | null) => s?.user?.id ?? null)
    .catch(() => null);
  return me.then((id) => ({ data: { user: id ? { id } : null } }));
};

const client = { ...makeFrom(run), storage: { from: bucket }, auth: { getUser } };

export type ApiClient = typeof client;

/** The browser's data client: `api().from("tasks").select(...)`, `api().storage.from("note-files").upload(...)`. */
export const api = () => client;
