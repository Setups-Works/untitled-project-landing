import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "@untitled/api-client";

describe("shared API client", () => {
  it("joins the configured origin, auth headers, and request headers", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ data: "ok" }), { status: 200 }));
    const api = createApiClient({
      baseUrl: "https://workspace.example/",
      credentials: "omit",
      getHeaders: async () => ({ Cookie: "session=token" }),
      fetcher: fetcher as unknown as typeof fetch,
    });

    const response = await api.request<{ data: string }>("/api/v1/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
    });

    expect(response).toEqual({ ok: true, status: 200, data: { data: "ok" } });
    expect(fetcher).toHaveBeenCalledWith(
      "https://workspace.example/api/v1/tasks",
      expect.objectContaining({ credentials: "omit" }),
    );
    const init = fetcher.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(init.headers).get("cookie")).toBe("session=token");
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
  });

  it("normalizes API error envelopes", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: { message: "Not allowed." } }), { status: 403 }));
    const api = createApiClient({ baseUrl: "", fetcher: fetcher as unknown as typeof fetch });

    await expect(api.request("/api/v1/tasks")).resolves.toEqual({
      ok: false,
      status: 403,
      error: { message: "Not allowed.", code: "403" },
    });
  });

  it("returns a typed network error when transport fails", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("offline");
    });
    const api = createApiClient({ baseUrl: "", fetcher: fetcher as unknown as typeof fetch });

    await expect(api.request("/api/v1/tasks")).resolves.toEqual({
      ok: false,
      status: 0,
      error: { message: "Network error. Check your connection and try again." },
    });
  });
});
