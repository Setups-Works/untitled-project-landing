/**
 * A small, typed query builder with the familiar `from(table).select().eq().order()` chaining.
 *
 * It only *describes* a query (a JSON "spec"). Something else runs it: in the browser the spec is POSTed to `/api/v1/db`, on the
 * server it is executed directly (see src/server/db/execute.ts). Either way the server validates the table and every column against
 * the real schema, passes all values as SQL parameters, and runs it as the signed-in user so Postgres Row-Level Security applies.
 * Results use the shape `{ data, error, count }`.
 */

export type FilterOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "is";
export type Filter = { column: string; op: FilterOp; value: unknown; not?: boolean };
export type Order = { column: string; ascending: boolean; nullsFirst?: boolean };

export type Spec = {
  table: string;
  op: "select" | "insert" | "update" | "delete" | "upsert";
  /** Select list: "*", "a,b", or with a to-one relation: "id,body,chats(title)". */
  columns?: string;
  /** Columns to return after a write (set by chaining `.select()`). */
  returning?: string | null;
  values?: Record<string, unknown> | Record<string, unknown>[];
  filters: Filter[];
  /** Raw "or" groups in the familiar form: `title.ilike."%x%",body.ilike."%x%"`. */
  or: string[];
  order: Order[];
  limit?: number;
  range?: [number, number];
  single?: "single" | "maybe";
  count?: "exact";
  head?: boolean;
  onConflict?: string;
};

export type ApiError = { message: string; code?: string; details?: string | null };
export type Result<T> = { data: T | null; error: ApiError | null; count: number | null };
export type Executor = (spec: Spec) => Promise<Result<unknown>>;

// Rows are untyped on purpose (the database is the source of truth); callers cast to their own row types, e.g. `data as Task[]`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

/** Chainable, awaitable query. Generic `T` is the row type callers expect; it is not checked against the database. */
export class Query<T = Row, R = T[]> implements PromiseLike<Result<R>> {
  private spec: Spec;
  constructor(
    private run: Executor,
    table: string,
  ) {
    this.spec = { table, op: "select", filters: [], or: [], order: [] };
  }

  select<N = T>(columns = "*", opts?: { count?: "exact"; head?: boolean }): Query<N, N[]> {
    if (this.spec.op === "select") this.spec.columns = columns;
    else this.spec.returning = columns;
    if (opts?.count) this.spec.count = opts.count;
    if (opts?.head) this.spec.head = true;
    return this as unknown as Query<N, N[]>;
  }
  insert(values: Row | Row[]): Query<T, T[]> {
    this.spec.op = "insert";
    this.spec.values = values;
    return this as unknown as Query<T, T[]>;
  }
  upsert(values: Row | Row[], opts?: { onConflict?: string }): Query<T, T[]> {
    this.spec.op = "upsert";
    this.spec.values = values;
    this.spec.onConflict = opts?.onConflict;
    return this as unknown as Query<T, T[]>;
  }
  update(values: Row): Query<T, T[]> {
    this.spec.op = "update";
    this.spec.values = values;
    return this as unknown as Query<T, T[]>;
  }
  delete(): Query<T, T[]> {
    this.spec.op = "delete";
    return this as unknown as Query<T, T[]>;
  }

  private f(column: string, op: FilterOp, value: unknown, not = false) {
    this.spec.filters.push({ column, op, value, not });
    return this;
  }
  eq = (c: string, v: unknown) => this.f(c, "eq", v);
  neq = (c: string, v: unknown) => this.f(c, "neq", v);
  gt = (c: string, v: unknown) => this.f(c, "gt", v);
  gte = (c: string, v: unknown) => this.f(c, "gte", v);
  lt = (c: string, v: unknown) => this.f(c, "lt", v);
  lte = (c: string, v: unknown) => this.f(c, "lte", v);
  like = (c: string, v: string) => this.f(c, "like", v);
  ilike = (c: string, v: string) => this.f(c, "ilike", v);
  in = (c: string, v: unknown[]) => this.f(c, "in", v);
  is = (c: string, v: null | boolean) => this.f(c, "is", v);
  not = (c: string, op: FilterOp, v: unknown) => this.f(c, op, v, true);
  or(expr: string) {
    this.spec.or.push(expr);
    return this;
  }

  order(column: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.spec.order.push({ column, ascending: opts?.ascending ?? true, nullsFirst: opts?.nullsFirst });
    return this;
  }
  limit(n: number) {
    this.spec.limit = n;
    return this;
  }
  range(from: number, to: number) {
    this.spec.range = [from, to];
    return this;
  }
  single(): Query<T, T> {
    this.spec.single = "single";
    return this as unknown as Query<T, T>;
  }
  maybeSingle(): Query<T, T | null> {
    this.spec.single = "maybe";
    return this as unknown as Query<T, T | null>;
  }

  then<A = Result<R>, B = never>(
    onfulfilled?: ((value: Result<R>) => A | PromiseLike<A>) | null,
    onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return this.run(this.spec)
      .then(
        (r) => r as Result<R>,
        (e: unknown): Result<R> => ({ data: null, error: { message: e instanceof Error ? e.message : "Request failed" }, count: null }),
      )
      .then(onfulfilled, onrejected);
  }
}

export const makeFrom = (run: Executor) => ({
  from: <T = Row>(table: string) => new Query<T>(run, table),
});
