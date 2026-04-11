import { execFileSync } from "node:child_process";
import { normalizeHttpUrl } from "@repo/common/url";

type LinkRow = { id: string; url: string; normalized_url: string };

function queryD1(sql: string, remote = false): LinkRow[] {
    const args = [
        "d1",
        "execute",
        "corvus",
        remote ? "--remote" : "--local",
        "--command",
        sql,
        "--json",
    ];
    const output = execFileSync("wrangler", args, {
        encoding: "utf-8",
        cwd: import.meta.dirname + "/..",
    });

    let parsed: unknown;
    try {
        parsed = JSON.parse(output);
    } catch {
        throw new Error(
            `[queryD1] Failed to parse wrangler output as JSON.\nRaw output:\n${output}`,
        );
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error(
            `[queryD1] Unexpected wrangler output shape (expected non-empty array).\nRaw output:\n${output}`,
        );
    }

    return (parsed[0] as { results?: LinkRow[] })?.results ?? [];
}

function escapeSqlValue(value: string): string {
    return value.replace(/'/g, "''");
}

function executeD1(sql: string, remote = false): void {
    const args = [
        "d1",
        "execute",
        "corvus",
        remote ? "--remote" : "--local",
        "--command",
        sql,
    ];
    execFileSync("wrangler", args, {
        encoding: "utf-8",
        cwd: import.meta.dirname + "/..",
    });
}

function main() {
    const remote = process.argv.includes("--remote");
    const mode = remote ? "REMOTE" : "LOCAL";
    console.log(`Backfilling normalized_url [${mode}]...`);

    const rows = queryD1(
        "SELECT id, url, normalized_url FROM wishlist_item_links",
        remote,
    );
    console.log(`Found ${rows.length} link rows.`);

    const updates: Array<{ id: string; normalized_url: string }> = [];

    for (const row of rows) {
        const canonical = normalizeHttpUrl(row.url);
        if (canonical !== row.normalized_url) {
            updates.push({ id: row.id, normalized_url: canonical });
        }
    }

    console.log(`${updates.length} rows need normalization.`);

    if (updates.length === 0) {
        console.log("Nothing to update.");
        return;
    }

    let successCount = 0;
    const failures: string[] = [];

    // Batch updates into chunks to avoid O(N) process launches.
    const BATCH_SIZE = 100;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE);
        const statements = batch.map(
            ({ id, normalized_url }) =>
                `UPDATE wishlist_item_links SET normalized_url = '${escapeSqlValue(normalized_url)}' WHERE id = '${escapeSqlValue(id)}';`,
        );
        const sql = `BEGIN TRANSACTION;\n${statements.join("\n")}\nCOMMIT;`;

        try {
            executeD1(sql, remote);
            successCount += batch.length;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(
                `[backfill] Failed to update batch starting at index ${i}: ${message}`,
            );
            // Fall back to per-row updates for this batch to identify failures
            for (const { id, normalized_url } of batch) {
                try {
                    executeD1(
                        `UPDATE wishlist_item_links SET normalized_url = '${escapeSqlValue(normalized_url)}' WHERE id = '${escapeSqlValue(id)}'`,
                        remote,
                    );
                    successCount++;
                } catch (rowErr) {
                    const rowMsg =
                        rowErr instanceof Error
                            ? rowErr.message
                            : String(rowErr);
                    console.error(
                        `[backfill] Failed to update row id=${id}: ${rowMsg}`,
                    );
                    failures.push(id);
                }
            }
        }
    }

    console.log(`Updated ${successCount} rows successfully.`);

    if (failures.length > 0) {
        console.error(
            `Failed to update ${failures.length} rows: ${failures.join(", ")}`,
        );
        process.exit(1);
    }
}

main();
