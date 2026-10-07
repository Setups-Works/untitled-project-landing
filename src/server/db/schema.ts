import "server-only";
import { pool } from "./pool";

/**
 * Tables the browser may query through /api/v1/db. Everything else (admin_audit, auth.*, schema_migrations) is unreachable from the
 * client, even though Row-Level Security would also stop it. Add a table here only after giving it RLS policies.
 */
export const CLIENT_TABLES = [
  "tasks",
  "task_lists",
  "notes",
  "note_versions",
  "journal_entries",
  "chats",
  "chat_folders",
  "chat_messages",
  "profiles",
  "announcements",
] as const;

/** To-one relations that `select("id,chats(title)")` may embed: table → alias → { foreign key column, related table }. */
export const RELATIONS: Record<string, Record<string, { fk: string; table: string }>> = {
  chat_messages: { chats: { fk: "chat_id", table: "chats" } },
};

export type ColumnInfo = { name: string; type: string };
export type TableInfo = Map<string, ColumnInfo>;

const g = globalThis as unknown as { __schema?: { at: number; tables: Map<string, TableInfo> } };

/** Column names and types of every public table, cached for a minute (so a migration is picked up without a restart). */
export async function schema(): Promise<Map<string, TableInfo>> {
  const now = Date.now();
  if (g.__schema && now - g.__schema.at < 60_000) return g.__schema.tables;
  const { rows } = await pool().query<{ table_name: string; column_name: string; data_type: string; udt_name: string }>(
    "select table_name, column_name, data_type, udt_name from information_schema.columns where table_schema = 'public' order by ordinal_position",
  );
  const tables = new Map<string, TableInfo>();
  for (const r of rows) {
    if (!tables.has(r.table_name)) tables.set(r.table_name, new Map());
    // `ARRAY` columns report udt_name like `_text`; json/jsonb need their values stringified, arrays do not.
    tables.get(r.table_name)!.set(r.column_name, { name: r.column_name, type: r.data_type === "ARRAY" ? "array" : r.udt_name });
  }
  g.__schema = { at: now, tables };
  return tables;
}
