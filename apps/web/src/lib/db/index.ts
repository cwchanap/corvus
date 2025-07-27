import {
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  Driver,
  DatabaseConnection,
  CompiledQuery,
  QueryResult,
} from "kysely";
import type { Database } from "./types";

// Custom D1 Driver for Kysely
class D1Driver implements Driver {
  constructor(private d1: D1Database) {}

  async init(): Promise<void> {
    // D1 doesn't need initialization
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    return new D1Connection(this.d1);
  }

  async beginTransaction(): Promise<void> {
    // D1 doesn't support explicit transactions
  }

  async commitTransaction(): Promise<void> {
    // D1 doesn't support explicit transactions
  }

  async rollbackTransaction(): Promise<void> {
    // D1 doesn't support explicit transactions
  }

  async releaseConnection(): Promise<void> {
    // D1 doesn't need connection release
  }

  async destroy(): Promise<void> {
    // D1 doesn't need cleanup
  }
}

class D1Connection implements DatabaseConnection {
  constructor(private d1: D1Database) {}

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const { sql, parameters } = compiledQuery;

    const result = await this.d1
      .prepare(sql)
      .bind(...parameters)
      .all();

    return {
      rows: (result.results || []) as O[],
      numAffectedRows: BigInt(result.meta?.changes || 0),
    };
  }

  async *streamQuery<O>(): AsyncIterableIterator<QueryResult<O>> {
    // D1 does not support streaming, so we yield nothing
    yield* [];
  }
}

export function createDatabase(d1?: D1Database): Kysely<Database> {
  // Use mock database for local development if D1 is not available
  if (!d1) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMockDatabase } = require("./mock");
    return createMockDatabase();
  }

  return new Kysely<Database>({
    dialect: {
      createAdapter: () => new SqliteAdapter(),
      createDriver: () => new D1Driver(d1),
      createIntrospector: (db) => new SqliteIntrospector(db),
      createQueryCompiler: () => new SqliteQueryCompiler(),
    },
  });
}

export * from "./types";
