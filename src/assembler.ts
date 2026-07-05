import { pickWeighted, createRng } from "./rng.js";
import { loadData, getStyle } from "./loader.js";
import type {
  AssembledCandidate,
  BlocksConfig,
  NormalizedOptions,
  PatternConfig,
  StyleConfig,
  StyleId,
} from "./types.js";

type BlockPool = keyof BlocksConfig;

const SLOT_TO_POOL: Record<string, BlockPool> = {
  start: "starts",
  nucleus: "nuclei",
  nucleus2: "nuclei",
  ending: "endings",
  ending2: "endings",
  bridge: "bridges",
};

function filterStartsByLength(starts: string[], length: number): string[] {
  return starts.filter((s) => s.length === length);
}

function pickBlock(
  style: StyleConfig,
  pool: BlockPool,
  rng: () => number,
  allowed?: string[],
): string {
  const weights = style.blocks[pool] ?? {};
  const master = loadData().blocks[pool];
  const fallback = Object.fromEntries(master.map((key) => [key, 1]));
  const source = Object.keys(weights).length > 0 ? weights : fallback;

  return pickWeighted(source, rng, allowed);
}

export function assembleCandidate(
  styleId: StyleId,
  rng: () => number,
): AssembledCandidate {
  const style = getStyle(styleId);
  const { patterns, blocks } = loadData();
  const patternId = pickWeighted(style.patterns, rng);
  const pattern = patterns[patternId];

  if (!pattern) {
    throw new Error(`Unknown pattern: ${patternId}`);
  }

  const parts: string[] = [];
  const validStarts = filterStartsByLength(
    blocks.starts,
    pattern.startLength,
  );

  let startBlock = "";
  let endBlock = "";

  for (const slot of pattern.slots) {
    const pool = SLOT_TO_POOL[slot];
    if (!pool) {
      throw new Error(`Unknown slot: ${slot}`);
    }

    let block: string;
    if (slot === "start") {
      block = pickBlock(style, pool, rng, validStarts);
      startBlock = block;
    } else {
      block = pickBlock(style, pool, rng);
    }

    if (slot === "ending" || slot === "ending2") {
      endBlock = block;
    }

    parts.push(block);
  }

  return {
    core: parts.join("").toUpperCase(),
    pattern: patternId,
    startBlock: startBlock.toUpperCase(),
    endBlock: endBlock.toUpperCase(),
  };
}

export { createRng };
