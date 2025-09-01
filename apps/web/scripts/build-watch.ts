import { spawn } from "node:child_process";
import { watch } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, "src");
const EXTRA_FILES = [join(ROOT, "app.config.ts")];

let building = false;
let queued = false;

function runBuild() {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  const proc = spawn("pnpm", ["run", "build"], {
    stdio: "inherit",
    cwd: ROOT,
    env: process.env,
  });
  proc.on("exit", (code) => {
    building = false;
    if (queued) {
      queued = false;
      runBuild();
    }
    if (code !== 0) {
      console.error("build failed with code", code);
    }
  });
}

function startWatch(path: string) {
  try {
    watch(path, { recursive: true }, (_event, filename) => {
      if (!filename) return;
      // Debounce via queueing; multiple rapid events coalesce
      runBuild();
    });
    console.log("Watching for changes:", path);
  } catch (err) {
    console.error("Failed to watch", path, err);
  }
}

// Initial build to ensure dist exists
runBuild();

startWatch(SRC_DIR);
for (const f of EXTRA_FILES) startWatch(f);
