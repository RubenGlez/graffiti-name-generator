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

/**
 * Validate every consonant run of `name` (the full prefix+core+suffix).
 *
 * A run is acceptable if it is an approved cluster, or if it is the word's
 * onset (the start block) or coda (the end block) at a *clean* word boundary.
 * A boundary is clean when the affix on that side is empty or ends/starts with
 * a vowel; a consonant-ending prefix (or consonant-starting suffix) merges with
 * the core into an internal junction that must itself be an approved cluster.
 */
export function hasValidClusters(
  name: string,
  startBlock: string,
  endBlock: string,
  startClean: boolean,
  endClean: boolean,
  clusters: Set<string>,
): boolean {
  const runs = getConsonantRuns(name);

  for (const run of runs) {
    if (clusters.has(run)) {
      continue;
    }

    if (
      startClean &&
      name.startsWith(run) &&
      (run === startBlock || startBlock.startsWith(run))
    ) {
      continue;
    }

    if (
      endClean &&
      name.endsWith(run) &&
      (run === endBlock || endBlock.endsWith(run))
    ) {
      continue;
    }

    return false;
  }

  return true;
}

export function checkCandidate(
  fullName: string,
  core: string,
  startBlock: string,
  endBlock: string,
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
    const startClean =
      options.prefix.length === 0 ||
      isVowel(options.prefix[options.prefix.length - 1]!);
    const endClean =
      options.suffix.length === 0 || isVowel(options.suffix[0]!);

    if (
      !hasValidClusters(
        fullName,
        startBlock,
        endBlock,
        startClean,
        endClean,
        data.clusters,
      )
    ) {
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
