import {
  InvalidOptionsError,
  STYLE_IDS,
  type GenerateOptions,
  type NormalizedOptions,
  type StyleId,
} from "./types.js";

const MIN_LEN = 3;
const MAX_LEN = 12;
const MAX_COUNT = 100;
const MAX_AFFIX = 4;

function normalizeUpper(value: string | undefined): string {
  return (value ?? "").toUpperCase().replace(/[^A-Z]/g, "");
}

function requireInt(
  value: number,
  field: string,
  min: number,
  max: number,
): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new InvalidOptionsError(
      `${field} must be an integer between ${min} and ${max}`,
    );
  }
  return value;
}

export function normalizeOptions(options: GenerateOptions): NormalizedOptions {
  if (!STYLE_IDS.includes(options.style)) {
    throw new InvalidOptionsError(`Unknown style: ${options.style}`);
  }

  const minLength = requireInt(options.minLength ?? 4, "minLength", MIN_LEN, MAX_LEN);
  const maxLength = requireInt(options.maxLength ?? 8, "maxLength", MIN_LEN, MAX_LEN);
  const count = requireInt(options.count ?? 10, "count", 1, MAX_COUNT);
  const prefix = normalizeUpper(options.prefix);
  const suffix = normalizeUpper(options.suffix);

  if (minLength > maxLength) {
    throw new InvalidOptionsError("minLength must be <= maxLength");
  }

  if (prefix.length > MAX_AFFIX) {
    throw new InvalidOptionsError(`prefix must be at most ${MAX_AFFIX} characters`);
  }

  if (suffix.length > MAX_AFFIX) {
    throw new InvalidOptionsError(`suffix must be at most ${MAX_AFFIX} characters`);
  }

  const affixLen = prefix.length + suffix.length;
  if (affixLen >= maxLength) {
    throw new InvalidOptionsError("prefix + suffix leave no room for generated core");
  }

  let seed: number;
  if (options.seed === undefined) {
    seed = Date.now() & 0x7fffffff;
  } else {
    seed = requireInt(options.seed, "seed", 0, 0x7fffffff);
  }

  return {
    minLength,
    maxLength,
    count,
    pronounceable: options.pronounceable ?? true,
    preferredLetters: normalizeUpper(options.preferredLetters),
    forbiddenLetters: normalizeUpper(options.forbiddenLetters),
    prefix,
    suffix,
    style: options.style,
    seed,
  };
}

export function isStyleId(value: string): value is StyleId {
  return (STYLE_IDS as readonly string[]).includes(value);
}
