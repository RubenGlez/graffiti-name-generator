import { pickWeighted } from "./rng.js";
import { loadData, getStyle } from "./loader.js";
import type {
  AssembledCandidate,
  BlocksConfig,
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

/** A pure two-consonant coda such as RK or SK (no vowel). */
function isConsonantCluster(block: string): boolean {
  return block.length === 2 && !/[AEIOU]/.test(block);
}

function endingsForShape(
  endings: string[],
  shape: PatternConfig["endingShape"],
): string[] | undefined {
  if (!shape) {
    return undefined;
  }
  return shape === "CC"
    ? endings.filter(isConsonantCluster)
    : endings.filter((e) => !isConsonantCluster(e));
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
  const validStarts = filterStartsByLength(blocks.starts, pattern.startLength);

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
    } else if (slot === "ending" || slot === "ending2") {
      const allowedEndings = endingsForShape(
        blocks.endings,
        pattern.endingShape,
      );
      block = pickBlock(style, pool, rng, allowedEndings);
      endBlock = block;
    } else {
      block = pickBlock(style, pool, rng);
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
