/// <reference types="@cloudflare/workers-types" />

declare module "@solidjs/start/server" {
  interface RequestEventLocals {
    cloudflare: {
      env: {
        DB: D1Database;
        SESSION_SECRET: string;
      };
    };
  }
}
