import { json } from "@solidjs/router";
import { getD1 } from "../../lib/cloudflare.js";
// Vite raw import to embed the SQL at build time
import schemaSql from "../../lib/db/schema.sql?raw";

export async function POST() {
  try {
    const db = getD1();

    // Split SQL into individual statements, ignoring line comments starting with '--'
    const lines = schemaSql
      .split(/\r?\n/)
      .map((l: string) => l.replace(/--.*$/, "")) // strip '--' comments
      .map((l: string) => l.trim());

    const statements: string[] = [];
    let current = "";
    for (const line of lines) {
      if (!line) continue; // skip empty/comment-only lines
      current += (current ? " " : "") + line;
      if (line.endsWith(";")) {
        const stmt = current.trim();
        if (stmt !== ";") statements.push(stmt);
        current = "";
      }
    }
    if (current.trim()) statements.push(current.trim());

    if (statements.length === 0) {
      return json(
        { success: false, message: "No SQL statements found" },
        { status: 400 },
      );
    }

    const prepared = statements.map((s) => {
      const withoutSemicolon = s.endsWith(";") ? s.slice(0, -1) : s;
      return db.prepare(withoutSemicolon);
    });
    const results = await db.batch(prepared);

    return json({ success: true, count: results.length });
  } catch (error) {
    return json(
      {
        success: false,
        message: "Failed to apply schema",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
