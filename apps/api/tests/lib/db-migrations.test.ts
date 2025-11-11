import { describe, expect, it, vi } from "vitest";
import type { DB } from "../../src/lib/db.ts";
import { createDefaultCategories } from "../../src/lib/db/migrations.ts";

describe("createDefaultCategories", () => {
    it("inserts the default categories for a user", async () => {
        const runMock = vi.fn().mockResolvedValue(undefined);
        const valuesMock = vi.fn(() => ({ run: runMock }));
        const insertMock = vi.fn(() => ({ values: valuesMock }));

        const db = {
            insert: insertMock,
        } as unknown as DB;

        await createDefaultCategories(db, 123);

        expect(insertMock).toHaveBeenCalledTimes(3);
        expect(valuesMock).toHaveBeenCalledTimes(3);
        expect(runMock).toHaveBeenCalledTimes(3);

        const payloads = valuesMock.mock.calls.map(([payload]) => payload);
        expect(payloads.map((item) => item.name)).toEqual([
            "General",
            "Work",
            "Personal",
        ]);
        payloads.forEach((payload) => {
            expect(payload.user_id).toBe(123);
            expect(typeof payload.id).toBe("string");
        });
    });
});
