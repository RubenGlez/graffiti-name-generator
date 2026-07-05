import type { StyleScoring } from "./types.js";

const GLOBAL_PREFIXES = ["KR", "SK", "TR"] as const;
const GLOBAL_SUFFIXES = ["ZE", "SK", "X"] as const;
const VOWELS = /[AEIOU]/;
const THREE_VOWELS = /[AEIOU]{3}/;
const FOUR_CONSONANTS = /[BCDFGHJKLMNPQRSTVWXYZ]{4}/;

export function scoreName(name: string, styleScoring?: StyleScoring): number {
  let score = 0;

  if (name.includes("K")) score += 2;
  if (name.includes("Z")) score += 2;
  if (name.includes("X")) score += 2;

  for (const prefix of GLOBAL_PREFIXES) {
    if (name.startsWith(prefix)) {
      score += 3;
      break;
    }
  }

  for (const suffix of GLOBAL_SUFFIXES) {
    if (name.endsWith(suffix)) {
      score += 3;
      break;
    }
  }

  if (THREE_VOWELS.test(name)) score -= 5;
  if (FOUR_CONSONANTS.test(name)) score -= 5;

  if (styleScoring?.bonusPrefixes) {
    for (const prefix of styleScoring.bonusPrefixes) {
      if (name.startsWith(prefix.toUpperCase())) {
        score += 2;
        break;
      }
    }
  }

  if (styleScoring?.bonusSuffixes) {
    for (const suffix of styleScoring.bonusSuffixes) {
      if (name.endsWith(suffix.toUpperCase())) {
        score += 2;
        break;
      }
    }
  }

  if (styleScoring?.bonusLetters) {
    for (const letter of styleScoring.bonusLetters) {
      if (name.includes(letter.toUpperCase())) {
        score += 1;
      }
    }
  }

  return score;
}

export function applyPreferredPenalty(
  name: string,
  preferredLetters: string,
  score: number,
): number {
  if (!preferredLetters) {
    return score;
  }

  const preferred = preferredLetters.toUpperCase().split("");
  const hasPreferred = preferred.some((letter) => name.includes(letter));
  return hasPreferred ? score : score - 2;
}

export function getThreshold(styleScoring?: StyleScoring): number {
  return styleScoring?.threshold ?? 0;
}

export { VOWELS };
