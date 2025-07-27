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

// Mock D1 Database for local development
class MockD1Database {
  private data: {
    users: unknown[];
    sessions: unknown[];
  } = {
    users: [],
    sessions: [],
  };

  prepare(sql: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      bind: (...params: unknown[]) => {
        const boundQuery = {
          all: async () => {
            console.log("Mock D1 Query:", sql, params);

            // Simple mock responses for common queries
            if (sql.includes("SELECT") && sql.includes("users")) {
              return { results: self.data.users, meta: { changes: 0 } };
            }

            if (sql.includes("INSERT INTO users")) {
              const newUser = {
                id: self.data.users.length + 1,
                email: params[0] || "test@example.com",
                name: params[2] || "Test User",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              self.data.users.push(newUser);
              return { results: [newUser], meta: { changes: 1 } };
            }

            if (sql.includes("INSERT INTO sessions")) {
              const newSession = {
                id: params[0] || "mock-session-id",
                user_id: params[1] || 1,
                expires_at:
                  params[2] ||
                  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString(),
              };
              self.data.sessions.push(newSession);
              return { results: [newSession], meta: { changes: 1 } };
            }

            return { results: [], meta: { changes: 0 } };
          },

          run: async () => {
            return boundQuery.all();
          },

          first: async () => {
            const result = await boundQuery.all();
            return result.results?.[0] || null;
          },
        };
        return boundQuery;
      },
    };
  }
}

// Mock D1 Driver for Kysely
class MockD1Driver implements Driver {
  constructor(private d1: MockD1Database) {}

  async init(): Promise<void> {}

  async acquireConnection(): Promise<DatabaseConnection> {
    return new MockD1Connection(this.d1);
  }

  async beginTransaction(): Promise<void> {}
  async commitTransaction(): Promise<void> {}
  async rollbackTransaction(): Promise<void> {}
  async releaseConnection(): Promise<void> {}
  async destroy(): Promise<void> {}
}

class MockD1Connection implements DatabaseConnection {
  constructor(private d1: MockD1Database) {}

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
    // Mock D1 does not support streaming, so we yield nothing
    yield* [];
  }
}

export function createMockDatabase(): Kysely<Database> {
  const mockD1 = new MockD1Database();

  return new Kysely<Database>({
    dialect: {
      createAdapter: () => new SqliteAdapter(),
      createDriver: () => new MockD1Driver(mockD1),
      createIntrospector: (db) => new SqliteIntrospector(db),
      createQueryCompiler: () => new SqliteQueryCompiler(),
    },
  });
}
