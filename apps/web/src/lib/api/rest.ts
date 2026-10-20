import { createApiClient, type Http } from "@untitled/api-client";

/** A failed request, carrying the server's friendly message (what a person may be shown) and the HTTP status. */
export class RestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const transport = createApiClient({ baseUrl: "", credentials: "same-origin" });
const json = { "content-type": "application/json" };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await transport.request<T>(path, init);
  if (res.ok) return res.data;
  throw new RestError(res.error.message, res.status);
}

/** The web's HTTP adapter for the shared API clients in packages/api-client (the app has its own, with cookie headers). */
export const http: Http = {
  get: (path) => call(path),
  post: (path, body) => call(path, { method: "POST", headers: json, body: JSON.stringify(body) }),
  patch: (path, body) => call(path, { method: "PATCH", headers: json, body: JSON.stringify(body) }),
  delete: (path) => call(path, { method: "DELETE" }),
};

export const restMessage = (e: unknown, fallback = "Something went wrong. Try again.") =>
  e instanceof RestError && e.message ? e.message : fallback;
