import { loadData } from "./loader.js";
import {
  applyPreferredPenalty,
  getThreshold,
  scoreName,
} from "./scorer.js";
import type {
  FilterResult,
  LoadedData,
  NormalizedOptions,
  StyleConfig,
} from "./types.js";

const VOWEL_SET = new Set(["A", "E", "I", "O", "U"]);

function isVowel(char: string): boolean {
  return VOWEL_SET.has(char);
}

function getConsonantRuns(name: string): string[] {
  const runs: string[] = [];
  let current = "";

  for (const char of name) {
    if (isVowel(char)) {
      if (current.length >= 2) {
        runs.push(current);
      }
      current = "";
      continue;
    }
    current += char;
  }

  if (current.length >= 2) {
    runs.push(current);
  }

  return runs;
}

export function hasValidClusters(
  core: string,
  startBlock: string,
  endBlock: string,
  clusters: Set<string>,
): boolean {
  const runs = getConsonantRuns(core);

  for (const run of runs) {
    if (run === startBlock || run === endBlock) {
      continue;
    }

    if (core.startsWith(run) && startBlock.startsWith(run)) {
      continue;
    }

    if (core.endsWith(run) && endBlock.endsWith(run)) {
      continue;
    }

    if (!clusters.has(run)) {
      return false;
    }
  }

  return true;
}

function extractStartAndEndBlocks(core: string, pattern: string): {
  startBlock: string;
  endBlock: string;
} {
  const data = loadData();
  const patternConfig = data.patterns[pattern];
  if (!patternConfig) {
    return { startBlock: core.slice(0, 1), endBlock: core.slice(-1) };
  }

  const startLen = patternConfig.startLength;
  let endBlock = "";

  if (pattern === "CCVCVC") {
    const slots = patternConfig.slots;
    endBlock = core.slice(-2);
    return { startBlock: core.slice(0, startLen), endBlock };
  }

  for (const len of [2, 1]) {
    const candidate = core.slice(-len);
    if (data.blocks.endings.includes(candidate)) {
      endBlock = candidate;
      break;
    }
  }

  if (!endBlock) {
    endBlock = core.slice(-1);
  }

  return { startBlock: core.slice(0, startLen), endBlock };
}

export function checkCandidate(
  fullName: string,
  core: string,
  pattern: string,
  options: NormalizedOptions,
  style: StyleConfig,
  data: LoadedData,
  accepted: Set<string>,
): FilterResult {
  if (
    fullName.length < options.minLength ||
    fullName.length > options.maxLength
  ) {
    return { accepted: false, reason: "length" };
  }

  if (options.forbiddenLetters) {
    for (const letter of options.forbiddenLetters) {
      if (fullName.includes(letter)) {
        return { accepted: false, reason: "forbidden" };
      }
    }
  }

  if (data.dictionary.has(fullName)) {
    return { accepted: false, reason: "dictionary" };
  }

  const lower = fullName.toLowerCase();
  for (const term of data.blocklist) {
    if (lower.includes(term.toLowerCase())) {
      return { accepted: false, reason: "blocklist" };
    }
  }

  if (options.pronounceable) {
    const { startBlock, endBlock } = extractStartAndEndBlocks(core, pattern);
    if (!hasValidClusters(core, startBlock, endBlock, data.clusters)) {
      return { accepted: false, reason: "cluster" };
    }
  }

  if (accepted.has(fullName)) {
    return { accepted: false, reason: "duplicate" };
  }

  let score = scoreName(fullName, style.scoring);
  score = applyPreferredPenalty(fullName, options.preferredLetters, score);

  const threshold = getThreshold(style.scoring);
  if (score < threshold) {
    return { accepted: false, reason: "score", score };
  }

  return { accepted: true, score };
}

export function validateAffix(affix: string, data: LoadedData): boolean {
  const upper = affix.toUpperCase();
  if (data.dictionary.has(upper)) {
    return false;
  }

  const lower = upper.toLowerCase();
  for (const term of data.blocklist) {
    if (lower.includes(term.toLowerCase())) {
      return false;
    }
  }

  return true;
}
