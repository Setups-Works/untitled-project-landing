import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBillingApi, type ByoKeyInput } from "@untitled/api-client";
import type { MyBilling, PlanId } from "@untitled/types";

import { api, errorMessage } from "@/lib/api";
import { qk } from "@/lib/queryKeys";

/** The same billing client the web uses (packages/api-client); only the HTTP adapter differs. */
const billingApi = createBillingApi(api);

export const useBilling = () => useQuery({ queryKey: qk.billing, queryFn: billingApi.mine });

/** Every change answers with the fresh billing state, which replaces the cache so the screen updates at once. */
export function useBillingActions(onError: (message: string) => void) {
  const qc = useQueryClient();
  const settle = {
    onSuccess: (data: MyBilling) => qc.setQueryData(qk.billing, data),
    onError: (e: unknown) => onError(errorMessage(e)),
  };
  return {
    choose: useMutation({ mutationFn: (planId: PlanId) => billingApi.choosePlan(planId), ...settle }),
    cancel: useMutation({ mutationFn: () => billingApi.cancel(), ...settle }),
    resume: useMutation({ mutationFn: () => billingApi.resume(), ...settle }),
    saveKey: useMutation({ mutationFn: (input: ByoKeyInput) => billingApi.saveKey(input), ...settle }),
    removeKey: useMutation({ mutationFn: () => billingApi.removeKey(), ...settle }),
  };
}
