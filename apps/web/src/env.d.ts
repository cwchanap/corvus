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

// Support importing raw SQL via Vite query suffix
declare module "*.sql?raw" {
  const content: string;
  export default content;
}
