import {
  CompiledQuery,
  DatabaseConnection,
  Driver,
  Kysely,
  QueryResult,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from "kysely";
import type { Database } from "./types.js";
import type { D1Database } from "@cloudflare/workers-types";

class D1Driver implements Driver {
  constructor(private d1: D1Database) {}

  async init(): Promise<void> {}

  async acquireConnection(): Promise<DatabaseConnection> {
    return new D1Connection(this.d1);
  }

  async beginTransaction(): Promise<void> {}
  async commitTransaction(): Promise<void> {}
  async rollbackTransaction(): Promise<void> {}
  async releaseConnection(): Promise<void> {}
  async destroy(): Promise<void> {}
}

class D1Connection implements DatabaseConnection {
  constructor(private d1: D1Database) {}

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const { sql, parameters } = compiledQuery;
    const isSelect = /^\s*select/i.test(sql);

    if (isSelect) {
      const res = await this.d1
        .prepare(sql)
        .bind(...parameters)
        .all();
      return {
        rows: (res?.results ?? []) as O[],
        numAffectedRows: BigInt(0),
      };
    } else {
      const res = await this.d1
        .prepare(sql)
        .bind(...parameters)
        .run();
      const changes = Number(res?.meta?.changes ?? 0);
      return {
        rows: [],
        numAffectedRows: BigInt(changes),
      };
    }
  }

  async *streamQuery<O>(): AsyncIterableIterator<QueryResult<O>> {
    // D1 does not support streaming queries through this driver
    // Empty async generator to satisfy interface without using `any`.
  }
}

export function createD1Kysely(d1: D1Database): Kysely<Database> {
  return new Kysely<Database>({
    dialect: {
      createAdapter: () => new SqliteAdapter(),
      createDriver: () => new D1Driver(d1),
      createIntrospector: (db) => new SqliteIntrospector(db),
      createQueryCompiler: () => new SqliteQueryCompiler(),
    },
  });
}
