import { build } from "esbuild";
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const webDir = join(root, "web");
const outDir = join(webDir, "dist");

// Wiped so hashed bundles from earlier builds are not left behind.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const result = await build({
  entryPoints: [join(webDir, "main.js")],
  outdir: outDir,
  // The host serves index.html with max-age=0 but scripts with max-age=14400,
  // so a fixed filename lets a browser pair new markup with a stale bundle.
  // Hashing the name makes every build a new URL and the two cannot drift.
  entryNames: "app-[hash]",
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  // Data files are inlined into the bundle: the page makes no requests of its
  // own, so it can be served from any static host (or opened over file://).
  loader: { ".txt": "text" },
  metafile: true,
});

const bundle = Object.keys(result.metafile.outputs)
  .map((path) => basename(path))
  .find((name) => name.endsWith(".js"));

if (!bundle) {
  throw new Error("esbuild produced no JavaScript bundle");
}

const html = readFileSync(join(webDir, "index.html"), "utf8");
if (!html.includes('src="app.js"')) {
  throw new Error('index.html no longer references src="app.js"');
}
writeFileSync(join(outDir, "index.html"), html.replace("app.js", bundle));

// 404.html makes Cloudflare Pages answer unknown paths with a real 404 instead
// of falling back to index.html with a 200.
for (const file of ["404.html", "robots.txt", "sitemap.xml", "og.jpg"]) {
  copyFileSync(join(webDir, file), join(outDir, file));
}

console.log(`Built web/dist (${bundle})`);
