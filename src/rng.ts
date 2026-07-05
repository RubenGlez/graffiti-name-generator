import { MissingDataError } from "./types.js";

export function createRng(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted<T extends string>(
  weights: Record<string, number>,
  rng: () => number,
  allowed?: readonly T[],
): T {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const pool =
    allowed !== undefined
      ? entries.filter(([key]) => (allowed as readonly string[]).includes(key))
      : entries;

  if (pool.length === 0) {
    throw new MissingDataError("No weighted options available for pick");
  }

  const total = pool.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;

  for (const [key, weight] of pool) {
    roll -= weight;
    if (roll <= 0) {
      return key as T;
    }
  }

  return pool[pool.length - 1]![0] as T;
}
