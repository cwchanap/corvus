import { json } from "@solidjs/router";
import { getD1 } from "../../lib/cloudflare.js";

// Seed a known test user: test@example.com / password123
// Pre-generated hash for local development
const EMAIL = "test@example.com";
const NAME = "Test User";
const PASSWORD_HASH =
  "Hh1KvXX3utDWTncrPnTXzaGchAs9KXmtPOGSU9Z3RBVQ5hUI0jcW+MmCDxQgX9VP";

export async function POST() {
  try {
    const db = getD1();

    const stmt = db.prepare(
      "INSERT OR IGNORE INTO users (email, password_hash, name) VALUES (?, ?, ?)",
    );
    const res = await stmt.bind(EMAIL, PASSWORD_HASH, NAME).run();

    return json({ success: true, changes: res.meta.changes });
  } catch (error) {
    return json(
      {
        success: false,
        message: "Failed to seed test user",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
