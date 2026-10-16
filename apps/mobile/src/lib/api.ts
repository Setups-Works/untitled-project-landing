import { createApiClient, type ApiResponse } from "@untitled/api-client";

import { mobileEnv } from "@/config/env";
import { authClient, discardLocalSession } from "@/lib/auth-client";

const client = createApiClient({
  baseUrl: mobileEnv.apiBaseUrl ?? "",
  // The session travels as an explicit Cookie header from SecureStore, not through the platform cookie jar.
  credentials: "omit",
  getHeaders: async (): Promise<Record<string, string>> => {
    const cookie = await authClient?.getCookie();
    return cookie ? { Cookie: cookie } : {};
  },
});

/** Thrown for failed requests so TanStack Query can show an error state; `status` 0 means the network was unreachable. */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const json = { "content-type": "application/json" };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res: ApiResponse<T> = await client.request<T>(path, init);
  if (res.ok) return res.data;
  // A 401 on an authenticated call means the session is gone: send the user back to sign-in instead of showing errors forever.
  if (res.status === 401) await discardLocalSession();
  throw new ApiRequestError(res.error.message, res.status);
}

export const api = {
  get: <T>(path: string) => call<T>(path),
  post: <T>(path: string, body: unknown) => call<T>(path, { method: "POST", headers: json, body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => call<T>(path, { method: "PUT", headers: json, body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => call<T>(path, { method: "PATCH", headers: json, body: JSON.stringify(body) }),
  delete: <T>(path: string) => call<T>(path, { method: "DELETE" }),
};

export const errorMessage = (e: unknown, fallback = "Something went wrong. Please try again.") =>
  e instanceof Error && e.message ? e.message : fallback;
