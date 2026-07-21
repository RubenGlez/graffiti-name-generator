// Local preview of the built site. Production is plain static hosting; this
// exists only so `npm run web` serves web/dist over http instead of file://.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "dist");
const PORT = process.env.PORT ? Number(process.env.PORT) : 5713;

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
};

const server = createServer(async (req, res) => {
  const path = normalize(new URL(req.url, "http://localhost").pathname);
  const file = join(root, path === "/" ? "index.html" : path);

  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[extname(file)] ?? "application/octet-stream",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Serving web/dist at http://localhost:${PORT}`);
});
