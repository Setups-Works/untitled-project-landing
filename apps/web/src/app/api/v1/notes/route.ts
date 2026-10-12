import { RESOURCES } from "../../../../lib/api/resources";
import { collectionHandlers } from "../../../../server/api/resource";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const { GET, POST } = collectionHandlers(RESOURCES.find((r) => r.key === "notes")!);
