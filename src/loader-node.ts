import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { clearDataCache, setDataSource } from "./loader.js";
import {
  MissingDataError,
  STYLE_IDS,
  type BlocksConfig,
  type DataFiles,
  type PatternConfig,
  type StyleConfig,
  type StyleId,
} from "./types.js";

let dataDirOverride: string | null = null;

export function setDataDir(dir: string): void {
  dataDirOverride = dir;
  clearDataCache();
}

export function getDataDir(): string {
  if (dataDirOverride) {
    return dataDirOverride;
  }

  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // Published/library layout: dist/loader-node.js -> ../data
    join(moduleDir, "..", "data"),
    // Test layout: dist-test/src/loader-node.js -> ../../data
    join(moduleDir, "..", "..", "data"),
    join(process.cwd(), "data"),
  ];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "blocks.json"))) {
      return candidate;
    }
  }

  throw new MissingDataError("Could not locate data directory");
}

function readText(path: string): string {
  if (!existsSync(path)) {
    throw new MissingDataError(`Missing data file: ${path}`);
  }

  return readFileSync(path, "utf8");
}

function readJson<T>(path: string): T {
  const raw = readText(path);

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new MissingDataError(`Invalid JSON in ${path}: ${detail}`);
  }
}

export function readDataFiles(): DataFiles {
  const dataDir = getDataDir();

  const styles = {} as Record<StyleId, StyleConfig>;
  for (const id of STYLE_IDS) {
    styles[id] = readJson<StyleConfig>(join(dataDir, "styles", `${id}.json`));
  }

  return {
    blocks: readJson<BlocksConfig>(join(dataDir, "blocks.json")),
    patterns: readJson<Record<string, PatternConfig>>(
      join(dataDir, "patterns.json"),
    ),
    clusters: readJson<string[]>(join(dataDir, "clusters.json")),
    dictionary: readText(join(dataDir, "dictionary-en.txt")),
    blocklist: readText(join(dataDir, "blocklist.txt")),
    styles,
  };
}

setDataSource(readDataFiles);
