import { execSync } from "node:child_process";
import { normalizeHttpUrl } from "@repo/common/url";

type LinkRow = { id: string; url: string; normalized_url: string };

function queryD1(sql: string, remote = false): LinkRow[] {
    const flag = remote ? "--remote" : "--local";
    const cmd = `wrangler d1 execute corvus ${flag} --command="${sql.replace(/"/g, '\\"')}" --json`;
    const output = execSync(cmd, {
        encoding: "utf-8",
        cwd: import.meta.dirname + "/..",
    });
    const parsed = JSON.parse(output);
    return parsed?.[0]?.results ?? [];
}

function executeD1(sql: string, remote = false): void {
    const flag = remote ? "--remote" : "--local";
    const escaped = sql.replace(/'/g, "''");
    const cmd = `wrangler d1 execute corvus ${flag} --command="${escaped.replace(/"/g, '\\"')}"`;
    console.log(`Executing: ${cmd}`);
    execSync(cmd, { encoding: "utf-8", cwd: import.meta.dirname + "/.." });
}

function main() {
    const remote = process.argv.includes("--remote");
    const mode = remote ? "REMOTE" : "LOCAL";
    console.log(`Backfilling normalized_url [${mode}]...`);

    const rows = queryD1(
        "SELECT id, url, normalized_url FROM wishlist_item_links",
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

    for (const { id, normalized_url } of updates) {
        executeD1(
            `UPDATE wishlist_item_links SET normalized_url = '${normalized_url}' WHERE id = '${id}'`,
            remote,
        );
    }

    console.log(`Updated ${updates.length} rows.`);
}

main();
