import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export type AuthConfig = { google: boolean; googleClientId: string | null; configured: boolean };

/** What the server offers (is Google sign-in on, is the backend configured). The same endpoint the web sign-in page reads. */
export function useAuthConfig() {
  return useQuery({ queryKey: ["auth-config"], queryFn: () => api.get<AuthConfig>("/api/v1/auth-config"), staleTime: 60_000, retry: 1 });
}
