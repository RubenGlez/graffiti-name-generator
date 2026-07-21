import {
  MissingDataError,
  STYLE_IDS,
  type BlocksConfig,
  type DataFiles,
  type LoadedData,
  type StyleConfig,
  type StyleId,
} from "./types.js";

let cached: LoadedData | null = null;
let source: (() => DataFiles) | null = null;

/**
 * Registers where raw data comes from. Node entry points install a filesystem
 * source on import; browser builds install one backed by bundled data.
 */
export function setDataSource(read: () => DataFiles): void {
  source = read;
  cached = null;
}

export function clearDataCache(): void {
  cached = null;
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

function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function buildData(files: DataFiles): LoadedData {
  const styles = new Map<StyleId, StyleConfig>();
  for (const id of STYLE_IDS) {
    const style = files.styles[id];
    if (!style) {
      throw new MissingDataError(`Missing style: ${id}`);
    }
    if (style.id !== id) {
      throw new MissingDataError(`Style id mismatch in ${id}.json`);
    }
    styles.set(id, style);
  }

  return {
    blocks: files.blocks,
    patterns: files.patterns,
    clusters: new Set(files.clusters),
    dictionary: new Set(parseLines(files.dictionary)),
    blocklist: parseLines(files.blocklist),
    styles,
  };
}

export function loadData(): LoadedData {
  if (cached) {
    return cached;
  }

  if (!source) {
    throw new MissingDataError(
      "No data source registered. Import the package entry point, or call setDataSource() first.",
    );
  }

  const data = buildData(source());
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
