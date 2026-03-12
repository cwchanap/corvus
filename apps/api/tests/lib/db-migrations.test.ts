import { describe, expect, it, vi } from "vitest";
import type { DB } from "../../src/lib/db";
import { createDefaultCategories } from "../../src/lib/db/migrations";

describe("createDefaultCategories", () => {
    function makeDb(existingCount: number) {
        const getMock = vi.fn().mockResolvedValue({ count: existingCount });
        const whereMock = vi.fn(() => ({ get: getMock }));
        const fromMock = vi.fn(() => ({ where: whereMock }));
        const selectMock = vi.fn(() => ({ from: fromMock }));

        const runMock = vi.fn().mockResolvedValue(undefined);
        const valuesMock = vi.fn(() => ({ run: runMock }));
        const insertMock = vi.fn(() => ({ values: valuesMock }));

        const db = { select: selectMock, insert: insertMock } as unknown as DB;
        return { db, selectMock, getMock, insertMock, valuesMock, runMock };
    }

    it("inserts the default categories when none exist", async () => {
        const { db, selectMock, insertMock, valuesMock, runMock } = makeDb(0);

        await createDefaultCategories(db, "user-uuid-123");

        expect(selectMock).toHaveBeenCalledTimes(1);
        expect(insertMock).toHaveBeenCalledTimes(3);
        expect(valuesMock).toHaveBeenCalledTimes(3);
        expect(runMock).toHaveBeenCalledTimes(3);

        const payloads = valuesMock.mock.calls.map(
            (call) =>
                (call as unknown[])[0] as {
                    name: string;
                    user_id: string;
                    id: string;
                },
        );
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
    });

    it("skips insert when user already has categories", async () => {
        const { db, selectMock, insertMock } = makeDb(3);

        await createDefaultCategories(db, "user-uuid-123");

        expect(selectMock).toHaveBeenCalledTimes(1);
        expect(insertMock).not.toHaveBeenCalled();
    });
});
