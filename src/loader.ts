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
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new MissingDataError(`Invalid JSON in ${path}: ${detail}`);
  }
}

const VALID_SLOTS = new Set([
  "start",
  "nucleus",
  "nucleus2",
  "ending",
  "ending2",
  "bridge",
]);

const BLOCK_POOLS: (keyof BlocksConfig)[] = [
  "starts",
  "nuclei",
  "endings",
  "bridges",
];

function isPureConsonantCluster(block: string): boolean {
  return block.length === 2 && !/[AEIOU]/.test(block);
}

function validateWeights(weights: Record<string, number>, where: string): void {
  let positive = false;
  for (const [key, weight] of Object.entries(weights)) {
    if (typeof weight !== "number" || !Number.isFinite(weight) || weight < 0) {
      throw new MissingDataError(
        `${where}: weight for "${key}" must be a finite number >= 0`,
      );
    }
    if (weight > 0) {
      positive = true;
    }
  }
  if (!positive) {
    throw new MissingDataError(`${where}: needs at least one positive weight`);
  }
}

function validateData(data: LoadedData): void {
  // Blocks: non-empty A-Z arrays.
  for (const pool of BLOCK_POOLS) {
    const list = data.blocks[pool];
    if (!Array.isArray(list) || list.length === 0) {
      throw new MissingDataError(`blocks.${pool} must be a non-empty array`);
    }
    for (const block of list) {
      if (!/^[A-Z]+$/.test(block)) {
        throw new MissingDataError(
          `blocks.${pool} entry "${block}" must be uppercase A-Z`,
        );
      }
    }
  }

  // Clusters: pure consonant sequences.
  for (const cluster of data.clusters) {
    if (!/^[BCDFGHJKLMNPQRSTVWXYZ]+$/.test(cluster)) {
      throw new MissingDataError(
        `clusters entry "${cluster}" must be a consonant-only sequence`,
      );
    }
  }

  // Patterns: known slots, viable start length and ending shape.
  const startLengths = new Set(data.blocks.starts.map((s) => s.length));
  const hasCCEnding = data.blocks.endings.some(isPureConsonantCluster);
  const hasNonCCEnding = data.blocks.endings.some(
    (e) => !isPureConsonantCluster(e),
  );

  for (const [patternId, pattern] of Object.entries(data.patterns)) {
    if (!Array.isArray(pattern.slots) || pattern.slots.length === 0) {
      throw new MissingDataError(`pattern "${patternId}" has no slots`);
    }
    for (const slot of pattern.slots) {
      if (!VALID_SLOTS.has(slot)) {
        throw new MissingDataError(
          `pattern "${patternId}" uses unknown slot "${slot}"`,
        );
      }
    }
    if (!startLengths.has(pattern.startLength)) {
      throw new MissingDataError(
        `pattern "${patternId}" needs a start of length ${pattern.startLength}, none exists`,
      );
    }
    if (pattern.endingShape === "CC" && !hasCCEnding) {
      throw new MissingDataError(
        `pattern "${patternId}" needs a two-consonant ending, none exists`,
      );
    }
    if (pattern.endingShape === "C" && !hasNonCCEnding) {
      throw new MissingDataError(
        `pattern "${patternId}" needs a single/syllabic ending, none exists`,
      );
    }
  }

  // Styles: valid weights, known references, defaults within limits.
  for (const id of STYLE_IDS) {
    const style = data.styles.get(id)!;

    validateWeights(style.patterns, `style "${id}" patterns`);
    for (const patternId of Object.keys(style.patterns)) {
      if (!data.patterns[patternId]) {
        throw new MissingDataError(
          `style "${id}" references unknown pattern "${patternId}"`,
        );
      }
    }

    for (const pool of BLOCK_POOLS) {
      const weights = style.blocks[pool];
      if (!weights) {
        continue;
      }
      validateWeights(weights, `style "${id}" blocks.${pool}`);
      const master = new Set(data.blocks[pool]);
      for (const key of Object.keys(weights)) {
        if (!master.has(key)) {
          throw new MissingDataError(
            `style "${id}" blocks.${pool} references unknown block "${key}"`,
          );
        }
      }
    }

    const { minLength, maxLength } = style.defaults;
    if (minLength < 3 || maxLength > 12 || minLength > maxLength) {
      throw new MissingDataError(
        `style "${id}" defaults must satisfy 3 <= minLength <= maxLength <= 12`,
      );
    }
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

  const data: LoadedData = {
    blocks,
    patterns,
    clusters: new Set(clusterList),
    dictionary,
    blocklist,
    styles,
  };

  validateData(data);

  cached = data;
  return cached;
}

export function getStyle(styleId: StyleId): StyleConfig {
  const style = loadData().styles.get(styleId);
  if (!style) {
    throw new MissingDataError(`Unknown style: ${styleId}`);
  }
  return style;
}
