import { build } from "esbuild";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "web", "dist");

mkdirSync(outDir, { recursive: true });

await build({
  entryPoints: [join(root, "web", "main.js")],
  outfile: join(outDir, "app.js"),
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  // Data files are inlined into the bundle: the page makes no requests of its
  // own, so it can be served from any static host (or opened over file://).
  loader: { ".txt": "text" },
});

// 404.html makes Cloudflare Pages answer unknown paths with a real 404 instead
// of falling back to index.html with a 200.
for (const file of [
  "index.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "og.jpg",
]) {
  copyFileSync(join(root, "web", file), join(outDir, file));
}

console.log("Built web/dist");
