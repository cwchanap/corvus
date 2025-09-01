import type { DB } from "../db.js";
import { wishlistCategories } from "./schema.js";

// Note: We rely on `schema.sql` and Wrangler scripts for DDL. This file keeps
// Drizzle-powered data bootstrapping utilities only.

export async function createDefaultCategories(db: DB, userId: number) {
  const defaultCategories = [
    { name: "General", color: "#6366f1" },
    { name: "Work", color: "#059669" },
    { name: "Personal", color: "#dc2626" },
  ];

  for (const category of defaultCategories) {
    await db
      .insert(wishlistCategories)
      .values({
        id: crypto.randomUUID(),
        user_id: userId,
        ...category,
      })
      .run();
  }
}
