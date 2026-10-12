import { api } from "@/lib/api";

type Filter = { column: string; op: "eq"; value: unknown };
type Spec = {
  table: string;
  op: "select" | "insert" | "update" | "delete";
  columns?: string;
  returning?: string | null;
  values?: Record<string, unknown>;
  filters?: Filter[];
  order?: { column: string; ascending: boolean }[];
  limit?: number;
  single?: "single" | "maybe";
};
type Result<T> = { data: T | null; count: number | null; error: { message: string; code?: string } | null };

/** The same allow-listed, row-level-security-protected query door the web chat uses (POST /api/v1/db). */
export async function dbQuery<T>(spec: Spec): Promise<T | null> {
  const res = await api.post<Result<T>>("/api/v1/db", { filters: [], or: [], order: [], ...spec });
  if (res.error) throw new Error(res.error.message);
  return res.data;
}
