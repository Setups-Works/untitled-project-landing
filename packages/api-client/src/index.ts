export type ApiError = {
  message: string;
  code?: string;
};

export type ApiResponse<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: ApiError };

export type ApiClientOptions = {
  /** An origin such as https://app.example.com. Leave empty for same-origin web requests. */
  baseUrl: string;
  credentials?: RequestCredentials;
  getHeaders?: () => Promise<Record<string, string>>;
  fetcher?: typeof fetch;
};

function errorMessage(body: unknown, fallback: string) {
  if (typeof body !== "object" || body === null) return fallback;
  const error = (body as { error?: unknown }).error;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

/** Platform-independent JSON transport for the web and Expo clients. Callers provide their own auth headers. */
export function createApiClient(options: ApiClientOptions) {
  const fetcher = options.fetcher ?? globalThis.fetch;
  const baseUrl = options.baseUrl.replace(/\/+$/, "");

  return {
    async request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
      const headers = new Headers(init.headers);
      headers.set("accept", "application/json");
      for (const [name, value] of Object.entries((await options.getHeaders?.()) ?? {})) {
        headers.set(name, value);
      }

      const url = baseUrl ? `${baseUrl}/${path.replace(/^\/+/, "")}` : path;
      try {
        const response = await fetcher(url, {
          ...init,
          credentials: options.credentials ?? "same-origin",
          headers,
        });
        const body: unknown = await response.json().catch(() => undefined);
        if (!response.ok) {
          return {
            ok: false,
            status: response.status,
            error: { message: errorMessage(body, "Request failed."), code: String(response.status) },
          };
        }
        return { ok: true, status: response.status, data: body as T };
      } catch {
        return { ok: false, status: 0, error: { message: "Network error. Check your connection and try again." } };
      }
    },
  };
}
