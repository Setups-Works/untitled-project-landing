import "server-only";
import type { PoolClient } from "pg";
import type { ApiError, Filter, FilterOp, Result, Spec } from "../../lib/api/builder";
import { withOwner, withUser } from "./pool";
import { CLIENT_TABLES, RELATIONS, schema, type TableInfo } from "./schema";

export type Actor = { kind: "user"; userId: string } | { kind: "owner" };

/** Thrown for a malformed query; reported to the caller as a 400-style error without touching the database. */
class SpecError extends Error {
  code = "400";
}

const IDENT = /^[a-z_][a-z0-9_]*$/;
const OPS: readonly FilterOp[] = ["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "in", "is"];
const SQL_OP: Record<Exclude<FilterOp, "in" | "is">, string> = {
  eq: "=",
  neq: "<>",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
  like: "like",
  ilike: "ilike",
};
const MAX_ROWS = 5000;

const qi = (id: string) => `"${id}"`;

/** Splits "a,b(c,d),e" or an or-group on commas that are not inside quotes or parentheses. */
function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = false;
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "\\" && quote) {
      cur += ch + (s[++i] ?? "");
      continue;
    }
    if (ch === '"') quote = !quote;
    else if (!quote && ch === "(") depth++;
    else if (!quote && ch === ")") depth--;
    if (ch === "," && depth === 0 && !quote) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

class Builder {
  params: unknown[] = [];
  constructor(
    private table: string,
    private cols: TableInfo,
    private tables: Map<string, TableInfo>,
  ) {}

  param(v: unknown) {
    this.params.push(v);
    return `$${this.params.length}`;
  }

  col(name: unknown, info: TableInfo = this.cols): string {
    if (typeof name !== "string" || !IDENT.test(name) || !info.has(name)) throw new SpecError(`Unknown column "${String(name)}".`);
    return name;
  }

  /** A value ready to be a SQL parameter for this column (json columns need a JSON string, arrays stay arrays). */
  coerce(column: string, v: unknown) {
    const type = this.cols.get(column)?.type;
    if (v === null || v === undefined) return null;
    if (type === "json" || type === "jsonb") return JSON.stringify(v);
    if (type === "array") {
      if (!Array.isArray(v)) throw new SpecError(`Column "${column}" expects a list.`);
      return v;
    }
    if (typeof v === "object") throw new SpecError(`Column "${column}" expects a single value.`);
    return v;
  }

  selectList(columns: string | null | undefined, alias = "t"): string {
    const list = splitTop(columns && columns.trim() ? columns : "*");
    const parts: string[] = [];
    for (const item of list) {
      if (item === "*") {
        parts.push(`${alias}.*`);
        continue;
      }
      const rel = item.match(/^([a-z_][a-z0-9_]*)\(([\s\S]*)\)$/);
      if (rel) {
        const def = RELATIONS[this.table]?.[rel[1]];
        const info = def && this.tables.get(def.table);
        if (!def || !info) throw new SpecError(`Unknown relation "${rel[1]}".`);
        const inner = splitTop(rel[2]).map((c) => (c === "*" ? `${qi(def.table)}.*` : `${qi(def.table)}.${qi(this.col(c, info))}`));
        parts.push(
          `(select to_jsonb(r) from (select ${inner.join(", ") || "*"} from public.${qi(def.table)} where ${qi(def.table)}."id" = ${alias}.${qi(def.fk)}) r) as ${qi(rel[1])}`,
        );
        continue;
      }
      parts.push(`${alias}.${qi(this.col(item))}`);
    }
    return parts.join(", ");
  }

  condition(f: Pick<Filter, "column" | "op" | "value">): string {
    const c = `t.${qi(this.col(f.column))}`;
    if (!OPS.includes(f.op)) throw new SpecError("Unknown filter.");
    if (f.op === "is") {
      if (f.value === null) return `${c} is null`;
      if (f.value === true || f.value === false) return `${c} is ${f.value}`;
      throw new SpecError(`"is" expects null, true or false.`);
    }
    if (f.op === "in") {
      if (!Array.isArray(f.value)) throw new SpecError(`"in" expects a list.`);
      if (f.value.length > 1000) throw new SpecError("Too many values in list.");
      if (f.value.length === 0) return "false";
      return `${c} = any(${this.param(f.value.map(String))}::text[]::${this.castType(f.column)}[])`;
    }
    if (f.value === null || typeof f.value === "object") throw new SpecError(`"${f.op}" expects a single value.`);
    return `${c} ${SQL_OP[f.op]} ${this.param(f.value)}`;
  }

  /** The SQL type name to cast an `in (...)` list to, so ids compare as uuids and numbers as numbers. */
  private castType(column: string) {
    const t = this.cols.get(column)?.type ?? "text";
    return /^[a-z0-9_]+$/.test(t) && t !== "array" ? t : "text";
  }

  /** `or` groups look like  title.ilike."%x%",body.ilike."%x%"  */
  orGroup(expr: string): string {
    const parts = splitTop(expr).map((p) => {
      const m = p.match(/^([a-z_][a-z0-9_]*)\.(eq|neq|gt|gte|lt|lte|like|ilike|is)\.([\s\S]*)$/);
      if (!m) throw new SpecError("Bad filter expression.");
      let v: unknown = m[3];
      if (typeof v === "string" && v.length >= 2 && v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).replace(/\\(["\\])/g, "$1");
      else if (m[2] === "is") v = v === "null" ? null : v === "true" ? true : v === "false" ? false : v;
      return this.condition({ column: m[1], op: m[2] as FilterOp, value: v });
    });
    if (!parts.length) throw new SpecError("Empty filter group.");
    return `(${parts.join(" or ")})`;
  }

  where(spec: Spec): string {
    const clauses = spec.filters.map((f) => (f.not ? `not (${this.condition(f)})` : this.condition(f)));
    for (const g of spec.or) clauses.push(this.orGroup(g));
    return clauses.length ? ` where ${clauses.join(" and ")}` : "";
  }

  orderLimit(spec: Spec): string {
    let sql = "";
    if (spec.order.length)
      sql += ` order by ${spec.order
        .map(
          (o) =>
            `t.${qi(this.col(o.column))} ${o.ascending ? "asc" : "desc"}${o.nullsFirst === undefined ? "" : o.nullsFirst ? " nulls first" : " nulls last"}`,
        )
        .join(", ")}`;
    if (spec.range) {
      const [from, to] = spec.range.map((n) => Math.max(0, Math.floor(Number(n)) || 0));
      sql += ` limit ${Math.min(MAX_ROWS, Math.max(0, to - from + 1))} offset ${from}`;
    } else sql += ` limit ${Math.min(MAX_ROWS, Math.max(1, Math.floor(Number(spec.limit ?? 1000)) || 1000))}`;
    return sql;
  }
}

async function run(spec: Spec, c: PoolClient, tables: Map<string, TableInfo>): Promise<Result<unknown>> {
  const cols = tables.get(spec.table);
  if (!cols) throw new SpecError(`Unknown table "${spec.table}".`);
  const b = new Builder(spec.table, cols, tables);
  const from = `public.${qi(spec.table)} t`;
  let rows: unknown[] = [];
  let count: number | null = null;

  if (spec.op === "select") {
    const where = b.where(spec);
    if (spec.count === "exact")
      count = (await c.query<{ n: number }>(`select count(*)::int as n from ${from}${where}`, b.params)).rows[0].n;
    if (!spec.head) {
      const list = b.selectList(spec.columns);
      rows = (
        await c.query<{ r: unknown }>(`select to_jsonb(q) as r from (select ${list} from ${from}${where}${b.orderLimit(spec)}) q`, b.params)
      ).rows.map((x) => x.r);
    }
  } else {
    const returning = spec.returning ? ` returning *` : "";
    let core: string;
    if (spec.op === "delete" || spec.op === "update") {
      const where = (() => {
        const w = b.where({ ...spec });
        if (!w) throw new SpecError("Updates and deletes need a filter.");
        return w;
      })();
      // Postgres `delete/update ... where` can't alias columns with `t.` in `returning *` + CTE, so alias the table itself.
      if (spec.op === "delete") core = `delete from public.${qi(spec.table)} t${where}${returning}`;
      else {
        const entries = Object.entries((spec.values as Record<string, unknown>) ?? {});
        if (!entries.length) throw new SpecError("Nothing to update.");
        const sets = entries.map(([k, v]) => `${qi(b.col(k))} = ${b.param(b.coerce(k, v))}`).join(", ");
        core = `update public.${qi(spec.table)} t set ${sets}${where}${returning}`;
      }
    } else {
      const list = Array.isArray(spec.values) ? spec.values : spec.values ? [spec.values] : [];
      if (!list.length) throw new SpecError("Nothing to insert.");
      if (list.length > 500) throw new SpecError("Too many rows.");
      const keys = [...new Set(list.flatMap((r) => Object.keys(r)))].map((k) => b.col(k));
      const tuples = keys.length
        ? list.map((r) => `(${keys.map((k) => (k in r ? b.param(b.coerce(k, r[k])) : "default")).join(", ")})`).join(", ")
        : "";
      let conflict = "";
      if (spec.op === "upsert") {
        const target = splitTop(spec.onConflict ?? "").map((k) => b.col(k));
        if (!target.length) throw new SpecError("upsert needs onConflict.");
        const upd = keys.filter((k) => !target.includes(k)).map((k) => `${qi(k)} = excluded.${qi(k)}`);
        conflict = ` on conflict (${target.map(qi).join(", ")}) ${upd.length ? `do update set ${upd.join(", ")}` : "do nothing"}`;
      }
      core = keys.length
        ? `insert into public.${qi(spec.table)} (${keys.map(qi).join(", ")}) values ${tuples}${conflict}${returning}`
        : `insert into public.${qi(spec.table)} default values${returning}`;
    }
    if (spec.returning) {
      const list = b.selectList(spec.returning);
      rows = (
        await c.query<{ r: unknown }>(`with w as (${core}) select to_jsonb(q) as r from (select ${list} from w t) q`, b.params)
      ).rows.map((x) => x.r);
    } else await c.query(core, b.params);
  }

  if (spec.single) {
    if (rows.length === 1) return { data: rows[0], error: null, count };
    if (rows.length === 0 && spec.single === "maybe") return { data: null, error: null, count };
    return {
      data: null,
      error: {
        code: "PGRST116",
        message: "JSON object requested, multiple (or no) rows returned",
        details: `The result contains ${rows.length} rows`,
      },
      count,
    };
  }
  return { data: spec.head ? null : spec.op !== "select" && !spec.returning ? null : rows, error: null, count };
}

const fail = (error: ApiError): Result<unknown> => ({ data: null, error, count: null });

/**
 * Runs one query spec. Users run inside an RLS transaction as themselves; the owner actor (server code only) bypasses RLS.
 * `clientTables` restricts which tables a browser-originated spec may touch.
 */
export async function execute(spec: Spec, actor: Actor, opts: { clientTables?: boolean } = {}): Promise<Result<unknown>> {
  try {
    if (opts.clientTables && !(CLIENT_TABLES as readonly string[]).includes(spec.table))
      throw new SpecError(`Unknown table "${spec.table}".`);
    const tables = await schema();
    const go = (c: PoolClient) => run(spec, c, tables);
    return actor.kind === "user" ? await withUser(actor.userId, go) : await withOwner(go);
  } catch (e) {
    if (e instanceof SpecError) return fail({ message: e.message, code: e.code });
    const pgErr = e as { message?: string; code?: string; detail?: string };
    if (typeof pgErr?.code === "string" && /^[0-9A-Z]{5}$/.test(pgErr.code))
      return fail({ message: pgErr.message ?? "Database error", code: pgErr.code, details: pgErr.detail ?? null });
    console.error("db execute failed", e instanceof Error ? e.message : e);
    return fail({ message: "Something went wrong." });
  }
}
