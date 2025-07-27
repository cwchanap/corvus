#!/usr/bin/env node

/**
 * Database setup script for Corvus
 * This script helps initialize the Cloudflare D1 database
 */

/* eslint-env node */
/* eslint-disable no-undef */

import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_NAME = "corvus";
const SCHEMA_PATH = join(__dirname, "../src/lib/db/schema.sql");

console.log("🚀 Setting up Corvus database...\n");

try {
  // Step 1: Create D1 database
  console.log("1. Creating D1 database...");
  const createOutput = execSync(`npx wrangler d1 create ${DB_NAME}`, {
    encoding: "utf8",
    cwd: join(__dirname, ".."),
  });
  console.log(createOutput);

  // Extract database ID from output
  const dbIdMatch = createOutput.match(/database_id = "([^"]+)"/);
  if (dbIdMatch) {
    const databaseId = dbIdMatch[1];
    console.log(`✅ Database created with ID: ${databaseId}\n`);

    console.log(
      "📝 Please update your wrangler.toml file with this database ID:",
    );
    console.log(`database_id = "${databaseId}"\n`);
  }

  // Step 2: Execute schema
  console.log("2. Executing database schema...");
  execSync(`npx wrangler d1 execute ${DB_NAME} --file=${SCHEMA_PATH}`, {
    stdio: "inherit",
    cwd: join(__dirname, ".."),
  });
  console.log("✅ Schema executed successfully\n");

  // Step 3: Execute schema for remote (production)
  console.log("3. Setting up remote database...");
  console.log("Run this command when you're ready to deploy:");
  console.log(
    `npx wrangler d1 execute ${DB_NAME} --file=${SCHEMA_PATH} --remote\n`,
  );

  console.log("🎉 Database setup complete!");
  console.log("\nNext steps:");
  console.log("1. Update the database_id in wrangler.toml");
  console.log("2. Set a secure SESSION_SECRET in wrangler.toml");
  console.log("3. Run `pnpm dev` to start development");
  console.log("4. When ready to deploy, run the remote schema command above");
} catch (error) {
  console.error("❌ Error setting up database:", error.message);
  process.exit(1);
}
