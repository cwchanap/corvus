/* eslint-env node */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, "../.vinxi/build/client/_build");
const manifestPath = resolve(distDir, ".vite/manifest.json");
const indexPath = resolve(distDir, "index.html");
const clientKey = "virtual:$vinxi/handler/client";

if (!existsSync(manifestPath)) {
  console.error(`Missing manifest at ${manifestPath}. Run "pnpm build" first.`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const clientEntry = manifest[clientKey];

if (!clientEntry) {
  console.error(`Client entry "${clientKey}" not found in manifest.`);
  process.exit(1);
}

const assetHref = (file) => `/${file}`;

const preloadTags = (clientEntry.imports ?? [])
  .map((importKey) => manifest[importKey]?.file)
  .filter(Boolean)
  .map((file) => `<link rel="modulepreload" href="${assetHref(file)}">`)
  .join("\n    ");

const cssTags = (clientEntry.css ?? [])
  .map((file) => `<link rel="stylesheet" href="${assetHref(file)}">`)
  .join("\n    ");

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Corvus</title>
    ${preloadTags}
    ${cssTags}
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="${assetHref(clientEntry.file)}"></script>
  </body>
</html>
`;

writeFileSync(indexPath, html);
console.log(`Generated ${indexPath}`);
