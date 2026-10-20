import { createSharedJournalsApi } from "@untitled/api-client";

import { api } from "@/lib/api";

/** The shared-journal API, the same client the web uses (packages/api-client); only the HTTP adapter differs. */
export const sharedJournalsApi = createSharedJournalsApi(api);
