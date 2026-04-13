import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock node:child_process before any dynamic imports of the script
vi.mock("node:child_process", () => ({
    execFileSync: vi.fn(),
}));

// Mock the common URL utility
vi.mock("@repo/common/url", () => ({
    normalizeHttpUrl: vi.fn((url: string) => url),
}));

/**
 * Helper: build a valid wrangler D1 JSON response wrapping rows.
 */
function wranglerJson(
    rows: Array<{ id: string; url: string; normalized_url: string }>,
): string {
    return JSON.stringify([{ results: rows }]);
}

describe("scripts/backfill-normalized-urls", () => {
    let execFileSyncMock: ReturnType<typeof vi.fn>;
    let normalizeHttpUrlMock: ReturnType<typeof vi.fn>;
    let exitSpy: ReturnType<typeof vi.spyOn>;
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    let originalArgv: string[];

    beforeEach(async () => {
        // Snapshot argv so afterEach can do a full restore, not just a splice
        originalArgv = [...process.argv];

        // Reset module registry so each test re-executes main() fresh
        vi.resetModules();

        // Prevent process.exit from killing the test runner
        exitSpy = vi
            .spyOn(process, "exit")
            .mockImplementation((() => undefined) as () => never);

        consoleLogSpy = vi
            .spyOn(console, "log")
            .mockImplementation(() => undefined);
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => undefined);

        // After resetModules the factory re-runs, giving us fresh vi.fn() instances.
        // Calling mockReset() clears any accumulated once-queue values from prior tests.
        const childProcess = await import("node:child_process");
        execFileSyncMock = vi.mocked(childProcess.execFileSync) as ReturnType<
            typeof vi.fn
        >;
        execFileSyncMock.mockReset();

        const urlModule = await import("@repo/common/url");
        normalizeHttpUrlMock = vi.mocked(
            urlModule.normalizeHttpUrl,
        ) as ReturnType<typeof vi.fn>;
        normalizeHttpUrlMock.mockReset();
        // Default: identity – normalised URL matches stored URL so no updates needed
        normalizeHttpUrlMock.mockImplementation((url: string) => url);
    });

    afterEach(() => {
        exitSpy.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        // Fully restore argv to the snapshot taken in beforeEach
        process.argv.splice(0, process.argv.length, ...originalArgv);
    });

    // -------------------------------------------------------------------------
    // No rows in database
    // -------------------------------------------------------------------------
    it("logs nothing-to-update and makes no executeD1 call when the table is empty", async () => {
        execFileSyncMock.mockReturnValueOnce(wranglerJson([]));

        await import("../../scripts/backfill-normalized-urls");

        // Only the SELECT query (queryD1), no UPDATE (executeD1)
        expect(execFileSyncMock).toHaveBeenCalledTimes(1);
        expect(exitSpy).not.toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining("Nothing to update"),
        );
    });

    // -------------------------------------------------------------------------
    // All rows already normalised
    // -------------------------------------------------------------------------
    it("skips updates when every row already has the correct normalized_url", async () => {
        const rows = [
            {
                id: "1",
                url: "https://example.com",
                normalized_url: "https://example.com",
            },
            {
                id: "2",
                url: "https://other.com",
                normalized_url: "https://other.com",
            },
        ];
        execFileSyncMock.mockReturnValueOnce(wranglerJson(rows));
        // Default identity mock: normalizeHttpUrl(url) === url === normalized_url → no updates

        await import("../../scripts/backfill-normalized-urls");

        expect(execFileSyncMock).toHaveBeenCalledTimes(1);
        expect(exitSpy).not.toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining("Nothing to update"),
        );
    });

    // -------------------------------------------------------------------------
    // Single row that needs normalisation
    // -------------------------------------------------------------------------
    it("updates a single row that needs normalisation", async () => {
        const rows = [
            {
                id: "abc",
                url: "HTTPS://Example.COM/path",
                // normalized_url is stale – differs from what normalizer will return
                normalized_url: "stale",
            },
        ];
        execFileSyncMock.mockReturnValueOnce(wranglerJson(rows));
        normalizeHttpUrlMock.mockReturnValue("https://example.com/path");
        // executeD1 succeeds (void return)
        execFileSyncMock.mockReturnValueOnce(undefined);

        await import("../../scripts/backfill-normalized-urls");

        // queryD1 + executeD1 = 2 calls
        expect(execFileSyncMock).toHaveBeenCalledTimes(2);
        expect(exitSpy).not.toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining("Updated 1 rows successfully"),
        );
    });

    // -------------------------------------------------------------------------
    // escapeSqlValue – single quotes are doubled in generated SQL
    // -------------------------------------------------------------------------
    it("escapes single quotes in normalized_url when building the UPDATE statement", async () => {
        const rows = [
            {
                id: "id-1",
                url: "https://example.com/path",
                // stale value so update is triggered
                normalized_url: "stale",
            },
        ];
        execFileSyncMock.mockReturnValueOnce(wranglerJson(rows));
        // normalizeHttpUrl returns a URL containing a single quote
        normalizeHttpUrlMock.mockReturnValue("https://example.com/o'malley");
        execFileSyncMock.mockReturnValueOnce(undefined);

        await import("../../scripts/backfill-normalized-urls");

        // The second execFileSync call is the UPDATE; its args contain the SQL
        const executeArgs = execFileSyncMock.mock.calls[1] as [
            string,
            string[],
            unknown,
        ];
        const argsArray = executeArgs[1];
        const cmdIdx = argsArray.indexOf("--command");
        const sql = argsArray[cmdIdx + 1];
        // escapeSqlValue should double the single quote
        expect(sql).toContain("o''malley");
    });

    // -------------------------------------------------------------------------
    // escapeSqlValue – single quotes in id are also escaped
    // -------------------------------------------------------------------------
    it("escapes single quotes in the row id when building the UPDATE statement", async () => {
        const rows = [
            {
                id: "row'id",
                url: "https://example.com/path",
                normalized_url: "stale",
            },
        ];
        execFileSyncMock.mockReturnValueOnce(wranglerJson(rows));
        normalizeHttpUrlMock.mockReturnValue("https://example.com/normalized");
        execFileSyncMock.mockReturnValueOnce(undefined);

        await import("../../scripts/backfill-normalized-urls");

        const executeArgs = execFileSyncMock.mock.calls[1] as [
            string,
            string[],
            unknown,
        ];
        const argsArray = executeArgs[1];
        const cmdIdx = argsArray.indexOf("--command");
        const sql = argsArray[cmdIdx + 1];
        // The id single quote should be escaped to ''
        expect(sql).toContain("row''id");
    });

    // -------------------------------------------------------------------------
    // --remote flag is forwarded to wrangler
    // -------------------------------------------------------------------------
    it("passes --remote to wrangler when process.argv contains --remote", async () => {
        process.argv.push("--remote");

        const rows = [
            {
                id: "r1",
                url: "https://example.com",
                normalized_url: "https://example.com",
            },
        ];
        execFileSyncMock.mockReturnValueOnce(wranglerJson(rows));
        // identity – no updates needed, we only care about the SELECT args

        await import("../../scripts/backfill-normalized-urls");

        const queryArgs = execFileSyncMock.mock.calls[0] as [
            string,
            string[],
            unknown,
        ];
        expect(queryArgs[1]).toContain("--remote");
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining("REMOTE"),
        );
    });

    it("passes --remote to executeD1 as well when rows need updating", async () => {
        process.argv.push("--remote");

        const rows = [
            {
                id: "remote-update",
                url: "https://example.com",
                normalized_url: "stale",
            },
        ];
        execFileSyncMock.mockReturnValueOnce(wranglerJson(rows));
        normalizeHttpUrlMock.mockReturnValue("https://example.com/normalized");
        execFileSyncMock.mockReturnValueOnce(undefined);

        await import("../../scripts/backfill-normalized-urls");

        const executeArgs = execFileSyncMock.mock.calls[1] as [
            string,
            string[],
            unknown,
        ];
        expect(executeArgs[1]).toContain("--remote");
        expect(exitSpy).not.toHaveBeenCalled();
    });

    it("uses --local when --remote is not in process.argv", async () => {
        const rows = [
            {
                id: "l1",
                url: "https://example.com",
                normalized_url: "https://example.com",
            },
        ];
        execFileSyncMock.mockReturnValueOnce(wranglerJson(rows));

        await import("../../scripts/backfill-normalized-urls");

        const queryArgs = execFileSyncMock.mock.calls[0] as [
            string,
            string[],
            unknown,
        ];
        expect(queryArgs[1]).toContain("--local");
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining("LOCAL"),
        );
    });

    // -------------------------------------------------------------------------
    // Batching: > 100 rows triggers multiple executeD1 calls
    // -------------------------------------------------------------------------
    it("batches updates into chunks of 100 rows", async () => {
        // Use a stale normalized_url so all 150 rows need updating
        const rows = Array.from({ length: 150 }, (_, i) => ({
            id: String(i + 1),
            url: `https://example.com/page${i + 1}`,
            normalized_url: "stale",
        }));
        execFileSyncMock.mockReturnValueOnce(wranglerJson(rows));
        normalizeHttpUrlMock.mockImplementation(
            (url: string) => `${url}/normalized`,
        );
        // executeD1 called twice (batch 1: rows 1-100, batch 2: rows 101-150)
        execFileSyncMock.mockReturnValue(undefined);

        await import("../../scripts/backfill-normalized-urls");

        // 1 queryD1 + 2 executeD1 batches = 3 total
        expect(execFileSyncMock).toHaveBeenCalledTimes(3);
        expect(exitSpy).not.toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining("Updated 150 rows successfully"),
        );
    });

    // -------------------------------------------------------------------------
    // Batch failure → per-row fallback succeeds
    // -------------------------------------------------------------------------
    it("falls back to per-row updates when a batch transaction fails", async () => {
        const rows = [
            {
                id: "fail-batch",
                url: "https://a.com",
                // stale so the update is triggered
                normalized_url: "stale",
            },
        ];
        execFileSyncMock.mockReturnValueOnce(wranglerJson(rows));
        normalizeHttpUrlMock.mockReturnValue("https://a.com/normalized");
        // Batch executeD1 throws
        execFileSyncMock.mockImplementationOnce(() => {
            throw new Error("Batch transaction failed");
        });
        // Per-row executeD1 succeeds
        execFileSyncMock.mockReturnValueOnce(undefined);

        await import("../../scripts/backfill-normalized-urls");

        expect(exitSpy).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("Failed to update batch"),
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining("Updated 1 rows successfully"),
        );
    });

    // -------------------------------------------------------------------------
    // Per-row failure → process.exit(1)
    // -------------------------------------------------------------------------
    it("calls process.exit(1) when per-row fallback also fails", async () => {
        const rows = [
            {
                id: "fail-row",
                url: "https://example.com",
                // stale so the update is triggered
                normalized_url: "stale",
            },
        ];
        execFileSyncMock.mockReturnValueOnce(wranglerJson(rows));
        normalizeHttpUrlMock.mockReturnValue("https://example.com/normalized");
        // Batch fails
        execFileSyncMock.mockImplementationOnce(() => {
            throw new Error("Batch failed");
        });
        // Per-row also fails
        execFileSyncMock.mockImplementationOnce(() => {
            throw new Error("Row update failed");
        });

        await import("../../scripts/backfill-normalized-urls");

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("Failed to update row id=fail-row"),
        );
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("Failed to update 1 rows"),
        );
    });

    // -------------------------------------------------------------------------
    // Batch failure with non-Error thrown value
    // -------------------------------------------------------------------------
    it("handles non-Error thrown values in batch failure message", async () => {
        const rows = [
            {
                id: "non-error",
                url: "https://example.com",
                // stale so the update is triggered
                normalized_url: "stale",
            },
        ];
        execFileSyncMock.mockReturnValueOnce(wranglerJson(rows));
        normalizeHttpUrlMock.mockReturnValue("https://example.com/normalized");
        // Batch fails with a plain string (non-Error)
        execFileSyncMock.mockImplementationOnce(() => {
            throw "string batch error";
        });
        // Per-row succeeds
        execFileSyncMock.mockReturnValueOnce(undefined);

        await import("../../scripts/backfill-normalized-urls");

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("string batch error"),
        );
        expect(exitSpy).not.toHaveBeenCalled();
    });

    // -------------------------------------------------------------------------
    // Per-row failure with non-Error thrown value
    // -------------------------------------------------------------------------
    it("handles non-Error thrown values in per-row failure message", async () => {
        const rows = [
            {
                id: "non-error-row",
                url: "https://example.com",
                // stale so the update is triggered
                normalized_url: "stale",
            },
        ];
        execFileSyncMock.mockReturnValueOnce(wranglerJson(rows));
        normalizeHttpUrlMock.mockReturnValue("https://example.com/normalized");
        // Batch fails
        execFileSyncMock.mockImplementationOnce(() => {
            throw new Error("Batch error");
        });
        // Per-row fails with a non-Error value (e.g. a number)
        execFileSyncMock.mockImplementationOnce(() => {
            throw 42;
        });

        await import("../../scripts/backfill-normalized-urls");

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("42"),
        );
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    // -------------------------------------------------------------------------
    // Invalid JSON from wrangler
    // -------------------------------------------------------------------------
    it("throws when wrangler returns non-JSON output", async () => {
        execFileSyncMock.mockReturnValueOnce("not-valid-json{{{");

        await expect(
            import("../../scripts/backfill-normalized-urls"),
        ).rejects.toThrow("Failed to parse wrangler output as JSON");
    });

    // -------------------------------------------------------------------------
    // Unexpected shape from wrangler (empty top-level array)
    // -------------------------------------------------------------------------
    it("throws when wrangler returns an empty top-level array", async () => {
        execFileSyncMock.mockReturnValueOnce(JSON.stringify([]));

        await expect(
            import("../../scripts/backfill-normalized-urls"),
        ).rejects.toThrow("Unexpected wrangler output shape");
    });

    // -------------------------------------------------------------------------
    // queryD1 returns results: undefined → treated as empty row set
    // -------------------------------------------------------------------------
    it("handles missing results key gracefully (returns empty row set)", async () => {
        // results key is absent – parsed[0] exists but has no .results
        execFileSyncMock.mockReturnValueOnce(JSON.stringify([{}]));

        await import("../../scripts/backfill-normalized-urls");

        expect(execFileSyncMock).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            expect.stringContaining("Nothing to update"),
        );
    });
});
