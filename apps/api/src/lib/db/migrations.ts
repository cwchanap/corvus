import type { DB } from "../db";
import { wishlistCategories } from "./schema";

// Note: We rely on Drizzle schema migrations for DDL. This file keeps
// Drizzle-powered data bootstrapping utilities only.

export async function createDefaultCategories(db: DB, userId: string) {
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
            .onConflictDoNothing()
            .run();
    }
}
