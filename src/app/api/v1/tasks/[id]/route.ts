import { RESOURCES } from "../../../../../lib/api/resources";
import { itemHandlers } from "../../../../../server/api/resource";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const { GET, PATCH, DELETE } = itemHandlers(RESOURCES.find((r) => r.key === "tasks")!);
