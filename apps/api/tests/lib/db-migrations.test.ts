import { describe, expect, it, vi } from "vitest";
import type { DB } from "../../src/lib/db";
import { createDefaultCategories } from "../../src/lib/db/migrations";

describe("createDefaultCategories", () => {
    function makeDb() {
        const runMock = vi.fn().mockResolvedValue(undefined);
        const onConflictDoNothingMock = vi.fn(() => ({ run: runMock }));
        const valuesMock = vi.fn(() => ({
            onConflictDoNothing: onConflictDoNothingMock,
        }));
        const insertMock = vi.fn(() => ({ values: valuesMock }));

        const db = { insert: insertMock } as unknown as DB;
        return {
            db,
            insertMock,
            valuesMock,
            onConflictDoNothingMock,
            runMock,
        };
    }

    it("inserts the default categories in one conflict-safe statement", async () => {
        const { db, insertMock, valuesMock, onConflictDoNothingMock, runMock } =
            makeDb();

        await createDefaultCategories(db, "user-uuid-123");

        expect(insertMock).toHaveBeenCalledTimes(1);
        expect(valuesMock).toHaveBeenCalledTimes(1);
        expect(onConflictDoNothingMock).toHaveBeenCalledTimes(1);
        expect(runMock).toHaveBeenCalledTimes(1);

        const [payloads] = valuesMock.mock.calls[0] as [
            {
                name: string;
                user_id: string;
                id: string;
            }[],
        ];
        expect(payloads.map((item) => item?.name)).toEqual([
            "General",
            "Work",
            "Personal",
        ]);
        payloads.forEach((payload) => {
            if (payload) {
                expect(payload.user_id).toBe("user-uuid-123");
                expect(typeof payload.id).toBe("string");
            }
        });
        expect(onConflictDoNothingMock).toHaveBeenCalledWith({
            target: expect.any(Array),
        });
    });
});
