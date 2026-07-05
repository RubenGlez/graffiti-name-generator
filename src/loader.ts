import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MissingDataError,
  STYLE_IDS,
  type BlocksConfig,
  type LoadedData,
  type PatternConfig,
  type StyleConfig,
  type StyleId,
} from "./types.js";

let cached: LoadedData | null = null;
let dataDirOverride: string | null = null;

export function setDataDir(dir: string): void {
  dataDirOverride = dir;
  cached = null;
}

export function getDataDir(): string {
  if (dataDirOverride) {
    return dataDirOverride;
  }

  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // Published/library layout: dist/loader.js -> ../data
    join(moduleDir, "..", "data"),
    // Test layout: dist-test/src/loader.js -> ../../data
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

function readJson<T>(path: string): T {
  if (!existsSync(path)) {
    throw new MissingDataError(`Missing data file: ${path}`);
  }

  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    throw new MissingDataError(`Invalid JSON in ${path}`);
  }
}

function readLines(path: string): string[] {
  if (!existsSync(path)) {
    throw new MissingDataError(`Missing data file: ${path}`);
  }

  return readFileSync(path, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

export function loadData(): LoadedData {
  if (cached) {
    return cached;
  }

  const dataDir = getDataDir();
  const blocks = readJson<BlocksConfig>(join(dataDir, "blocks.json"));
  const patterns = readJson<Record<string, PatternConfig>>(
    join(dataDir, "patterns.json"),
  );
  const clusterList = readJson<string[]>(join(dataDir, "clusters.json"));
  const dictionary = new Set(readLines(join(dataDir, "dictionary-en.txt")));
  const blocklist = readLines(join(dataDir, "blocklist.txt"));

  const styles = new Map<StyleId, StyleConfig>();
  for (const id of STYLE_IDS) {
    const style = readJson<StyleConfig>(join(dataDir, "styles", `${id}.json`));
    if (style.id !== id) {
      throw new MissingDataError(`Style id mismatch in ${id}.json`);
    }
    styles.set(id, style);
  }

  cached = {
    blocks,
    patterns,
    clusters: new Set(clusterList),
    dictionary,
    blocklist,
    styles,
  };

  return cached;
}

export function getStyle(styleId: StyleId): StyleConfig {
  const style = loadData().styles.get(styleId);
  if (!style) {
    throw new MissingDataError(`Unknown style: ${styleId}`);
  }
  return style;
}
