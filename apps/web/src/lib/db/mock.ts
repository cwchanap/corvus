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
import type { Database } from "./types.js";

interface MockUser {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface MockSession {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: string;
}

// Mock D1 Database for local development
class MockD1Database {
  private data: {
    users: MockUser[];
    sessions: MockSession[];
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

            // SELECT user by email
            if (/select[\s\S]*from\s+"?users"?/i.test(sql)) {
              // Handle simple where by email
              if (
                /where[\s\S]*"?email"?\s*=\s*\?/i.test(sql) &&
                params.length
              ) {
                const email = params[0] as string;
                const user = self.data.users.find((u) => u.email === email);
                return { results: user ? [user] : [], meta: { changes: 0 } };
              }
              return { results: self.data.users, meta: { changes: 0 } };
            }

            // INSERT INTO users (email, password_hash, name) ... RETURNING ...
            if (/insert\s+into\s+"?users"?/i.test(sql)) {
              const now = new Date().toISOString();
              // Try to parse column order from SQL e.g. ("email","password_hash","name")
              const usersColsMatch = sql.match(/users\s*\(([^)]+)\)/i);
              const usersColsRaw = usersColsMatch?.[1];
              const cols = usersColsRaw
                ? usersColsRaw.split(",").map((c) =>
                    c
                      .replace(/[^a-zA-Z_]/g, "")
                      .toLowerCase()
                      .trim(),
                  )
                : ["email", "password_hash", "name"];
              const colIndex = (name: string) => {
                const idx = cols.indexOf(name);
                return idx >= 0 ? idx : 0;
              };
              const newUser: MockUser = {
                id: self.data.users.length + 1,
                email:
                  (params[colIndex("email")] as string) || "test@example.com",
                password_hash:
                  (params[colIndex("password_hash")] as string) || "",
                name: (params[colIndex("name")] as string) || "Test User",
                created_at: now,
                updated_at: now,
              };
              self.data.users.push(newUser);
              // Simulate RETURNING by returning user without password_hash if requested
              // For simplicity, always return public fields
              const returned = {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                created_at: newUser.created_at,
                updated_at: newUser.updated_at,
              };
              return { results: [returned], meta: { changes: 1 } };
            }

            // INSERT INTO sessions (...)
            if (/insert\s+into\s+"?sessions"?/i.test(sql)) {
              const now = new Date().toISOString();
              const sessionsColsMatch = sql.match(/sessions\s*\(([^)]+)\)/i);
              const sessionsColsRaw = sessionsColsMatch?.[1];
              const cols = sessionsColsRaw
                ? sessionsColsRaw.split(",").map((c) =>
                    c
                      .replace(/[^a-zA-Z_]/g, "")
                      .toLowerCase()
                      .trim(),
                  )
                : ["id", "user_id", "expires_at"];
              const colIndex = (name: string) => {
                const idx = cols.indexOf(name);
                return idx >= 0 ? idx : 0;
              };
              const newSession: MockSession = {
                id: (params[colIndex("id")] as string) || "mock-session-id",
                user_id: (params[colIndex("user_id")] as number) || 1,
                expires_at:
                  (params[colIndex("expires_at")] as string) ||
                  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: now,
              };
              self.data.sessions.push(newSession);
              return { results: [newSession], meta: { changes: 1 } };
            }

            // SELECT join sessions and users by session id
            if (
              /select[\s\S]*from\s+"?sessions"?[\s\S]*join[\s\S]*"?users"?/i.test(
                sql,
              )
            ) {
              // Determine parameter order by inspecting SQL
              let idParamIndex = 0;
              let expParamIndex = 1;
              const where = sql.match(/where[\s\S]*$/i)?.[0] || "";
              const idFirst =
                /where[\s\S]*sessions\.id[\s\S]*\?[\s\S]*sessions\.expires_at[\s\S]*\?/i.test(
                  where,
                );
              const expFirst =
                /where[\s\S]*sessions\.expires_at[\s\S]*\?[\s\S]*sessions\.id[\s\S]*\?/i.test(
                  where,
                );
              if (expFirst) {
                idParamIndex = 1;
                expParamIndex = 0;
              } else if (idFirst) {
                idParamIndex = 0;
                expParamIndex = 1;
              } else {
                // Fallback: try to find param that matches an existing session id
                const candidateIndex = params.findIndex(
                  (p) =>
                    typeof p === "string" &&
                    self.data.sessions.some((s) => s.id === p),
                );
                if (candidateIndex >= 0) idParamIndex = candidateIndex;
              }

              const sessionId = params[idParamIndex] as string | undefined;
              const expiresAfter = params[expParamIndex] as string | undefined;

              const session = sessionId
                ? self.data.sessions.find((s) => s.id === sessionId)
                : undefined;
              if (!session) return { results: [], meta: { changes: 0 } };
              const user = self.data.users.find(
                (u) => u.id === session.user_id,
              );
              if (!user) return { results: [], meta: { changes: 0 } };
              // ensure not expired
              const nowTs = expiresAfter
                ? Date.parse(expiresAfter) - 1
                : Date.now();
              if (new Date(session.expires_at).getTime() <= nowTs) {
                return { results: [], meta: { changes: 0 } };
              }
              const row = {
                id: user.id,
                email: user.email,
                name: user.name,
                created_at: user.created_at,
                updated_at: user.updated_at,
                expires_at: session.expires_at,
              };
              return { results: [row], meta: { changes: 0 } };
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
