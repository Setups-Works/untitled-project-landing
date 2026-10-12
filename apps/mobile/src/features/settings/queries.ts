import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { qk } from "@/lib/queryKeys";
import type { AccountSettings } from "./types";

const key = [...qk.settings, "account"] as const;

export function useAccountSettings() {
  return useQuery({
    queryKey: key,
    queryFn: async () => (await api.get<{ data: AccountSettings }>("/api/v1/account/settings")).data,
  });
}
