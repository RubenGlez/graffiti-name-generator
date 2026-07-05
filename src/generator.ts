import { assembleCandidate } from "./assembler.js";
import { checkCandidate, validateAffix } from "./filters.js";
import { getStyle, loadData } from "./loader.js";
import { normalizeOptions } from "./options.js";
import { createRng } from "./rng.js";
import {
  InvalidOptionsError,
  type GenerateOptions,
  type GenerateResult,
  type GeneratedName,
} from "./types.js";

export function generate(options: GenerateOptions): GenerateResult {
  const data = loadData();
  const styleDefaults = data.styles.get(options.style)?.defaults;
  const normalized = normalizeOptions(options, styleDefaults);
  const style = getStyle(normalized.style);

  if (normalized.prefix && !validateAffix(normalized.prefix, data)) {
    throw new InvalidOptionsError("prefix fails dictionary or blocklist validation");
  }

  if (normalized.suffix && !validateAffix(normalized.suffix, data)) {
    throw new InvalidOptionsError("suffix fails dictionary or blocklist validation");
  }

  if (normalized.forbiddenLetters) {
    for (const letter of normalized.prefix + normalized.suffix) {
      if (normalized.forbiddenLetters.includes(letter)) {
        throw new InvalidOptionsError("prefix or suffix contains forbidden letter");
      }
    }
  }

  const rng = createRng(normalized.seed);
  const accepted = new Set<string>();
  const names: GeneratedName[] = [];
  const maxAttempts = normalized.count * 50;
  let attempts = 0;
  let rejected = 0;

  while (names.length < normalized.count && attempts < maxAttempts) {
    attempts += 1;

    const { core, pattern, startBlock, endBlock } = assembleCandidate(
      normalized.style,
      rng,
    );
    const fullName = `${normalized.prefix}${core}${normalized.suffix}`;

    const result = checkCandidate(
      fullName,
      core,
      startBlock,
      endBlock,
      normalized,
      style,
      data,
      accepted,
    );

    if (!result.accepted) {
      rejected += 1;
      continue;
    }

    accepted.add(fullName);
    names.push({
      name: fullName,
      score: result.score ?? 0,
      pattern,
    });
  }

  return {
    names,
    meta: {
      style: normalized.style,
      seed: normalized.seed,
      requested: normalized.count,
      attempts,
      rejected,
      exhausted: names.length < normalized.count,
    },
  };
}
