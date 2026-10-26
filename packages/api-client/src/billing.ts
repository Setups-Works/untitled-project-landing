import type { MyBilling, PlanId } from "@untitled/types";
import type { Http } from "./sharedJournals";

/** The plan and billing API, written once for the web and the Expo app. Routes: apps/web/src/app/api/v1/billing. */
type Data<T> = { data: T };
const base = "/api/v1/billing";

export type ByoKeyInput = { provider: string; model: string; apiKey: string };

export function createBillingApi(http: Http) {
  const unwrap = async <T>(p: Promise<Data<T>>) => (await p).data;
  return {
    mine: () => unwrap(http.get<Data<MyBilling>>(base)),
    choosePlan: (planId: PlanId) => unwrap(http.post<Data<MyBilling>>(`${base}/plan`, { planId })),
    cancel: () => unwrap(http.post<Data<MyBilling>>(`${base}/cancel`, {})),
    resume: () => unwrap(http.post<Data<MyBilling>>(`${base}/resume`, {})),
    saveKey: (input: ByoKeyInput) => unwrap(http.post<Data<MyBilling>>(`${base}/ai-key`, input)),
    removeKey: () => unwrap(http.delete<Data<MyBilling>>(`${base}/ai-key`)),
  };
}
export type BillingApi = ReturnType<typeof createBillingApi>;
