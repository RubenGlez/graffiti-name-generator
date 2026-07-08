import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import {
  generate,
  STYLE_IDS,
  InvalidOptionsError,
  MissingDataError,
} from "../dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? Number(process.env.PORT) : 5713;

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
};

async function serveStatic(res, path) {
  try {
    const body = await readFile(path);
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[extname(path)] ?? "application/octet-stream",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    await serveStatic(res, join(__dirname, "index.html"));
    return;
  }

  if (req.method === "GET" && req.url === "/styles") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(STYLE_IDS));
    return;
  }

  if (req.method === "POST" && req.url === "/generate") {
    try {
      const body = await readBody(req);
      const options = JSON.parse(body || "{}");
      const result = generate(options);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (error) {
      const status =
        error instanceof InvalidOptionsError || error instanceof MissingDataError
          ? 400
          : 500;
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      );
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Playground running at http://localhost:${PORT}`);
});
