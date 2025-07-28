import { createDatabase } from "../src/lib/db.js";
import { runMigrations } from "../src/lib/db/migrations.js";

async function migrate() {
  try {
    console.log("Running database migrations...");

    // For local development, we'll use a local SQLite database
    const db = createDatabase();
    await runMigrations(db);

    console.log("Migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
