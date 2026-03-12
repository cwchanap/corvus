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

    await db
        .insert(wishlistCategories)
        .values(
            defaultCategories.map((category) => ({
                id: crypto.randomUUID(),
                user_id: userId,
                ...category,
            })),
        )
        .onConflictDoNothing({
            target: [wishlistCategories.user_id, wishlistCategories.name],
        })
        .run();
}
