"use client";
import { createBillingApi, type ByoKeyInput } from "@untitled/api-client";
import type { MyBilling, PlanId } from "@untitled/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http, restMessage } from "../../lib/api/rest";
import { qk } from "../../lib/query/keys";

/** Data layer for Settings → Plan and billing. The calls are shared with the phone app (packages/api-client). */
const billingApi = createBillingApi(http);

export const useBilling = () => useQuery({ queryKey: qk.billing.me, queryFn: billingApi.mine });

/** Every change answers with the fresh billing state, which replaces the cache so the screen updates at once. */
export function useBillingActions(onError: (message: string) => void) {
  const qc = useQueryClient();
  const settle = {
    onSuccess: (data: MyBilling) => qc.setQueryData(qk.billing.me, data),
    onError: (e: unknown) => onError(restMessage(e, "Couldn’t update your plan.")),
  };
  const choose = useMutation({ mutationFn: (planId: PlanId) => billingApi.choosePlan(planId), ...settle });
  const cancel = useMutation({ mutationFn: () => billingApi.cancel(), ...settle });
  const resume = useMutation({ mutationFn: () => billingApi.resume(), ...settle });
  const saveKey = useMutation({ mutationFn: (input: ByoKeyInput) => billingApi.saveKey(input), ...settle });
  const removeKey = useMutation({ mutationFn: () => billingApi.removeKey(), ...settle });
  return { choose, cancel, resume, saveKey, removeKey };
}
