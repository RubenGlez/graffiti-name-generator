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

export function normalizeOptions(options: GenerateOptions): NormalizedOptions {
  if (!STYLE_IDS.includes(options.style)) {
    throw new InvalidOptionsError(`Unknown style: ${options.style}`);
  }

  const minLength = options.minLength ?? 4;
  const maxLength = options.maxLength ?? 8;
  const count = options.count ?? 10;
  const prefix = normalizeUpper(options.prefix);
  const suffix = normalizeUpper(options.suffix);

  if (minLength < MIN_LEN || minLength > MAX_LEN) {
    throw new InvalidOptionsError(`minLength must be between ${MIN_LEN} and ${MAX_LEN}`);
  }

  if (maxLength < MIN_LEN || maxLength > MAX_LEN) {
    throw new InvalidOptionsError(`maxLength must be between ${MIN_LEN} and ${MAX_LEN}`);
  }

  if (minLength > maxLength) {
    throw new InvalidOptionsError("minLength must be <= maxLength");
  }

  if (count < 1 || count > MAX_COUNT) {
    throw new InvalidOptionsError(`count must be between 1 and ${MAX_COUNT}`);
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
    seed: options.seed ?? (Date.now() & 0x7fffffff),
  };
}

export function isStyleId(value: string): value is StyleId {
  return (STYLE_IDS as readonly string[]).includes(value);
}
