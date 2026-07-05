export type StyleId =
  "old-school" | "modern" | "wildstyle" | "tech" | "minimal" | "hardcore";

export const STYLE_IDS: readonly StyleId[] = [
  "old-school",
  "modern",
  "wildstyle",
  "tech",
  "minimal",
  "hardcore",
];

export interface GenerateOptions {
  minLength?: number;
  maxLength?: number;
  count?: number;
  pronounceable?: boolean;
  preferredLetters?: string;
  forbiddenLetters?: string;
  prefix?: string;
  suffix?: string;
  style: StyleId;
  seed?: number;
}

export interface GeneratedName {
  name: string;
  score: number;
  pattern: string;
}

export interface GenerateResult {
  names: GeneratedName[];
  meta: {
    style: StyleId;
    seed: number;
    requested: number;
    attempts: number;
    rejected: number;
    exhausted: boolean;
  };
}

export interface NormalizedOptions {
  minLength: number;
  maxLength: number;
  count: number;
  pronounceable: boolean;
  preferredLetters: string;
  forbiddenLetters: string;
  prefix: string;
  suffix: string;
  style: StyleId;
  seed: number;
}

export interface StyleScoring {
  threshold?: number;
  bonusPrefixes?: string[];
  bonusSuffixes?: string[];
  bonusLetters?: string[];
}

export interface StyleConfig {
  id: StyleId;
  label: string;
  defaults: {
    minLength: number;
    maxLength: number;
    pronounceable: boolean;
  };
  patterns: Record<string, number>;
  blocks: {
    starts: Record<string, number>;
    nuclei: Record<string, number>;
    endings: Record<string, number>;
    bridges?: Record<string, number>;
  };
  scoring?: StyleScoring;
}

export type EndingShape = "CC" | "C";

export interface PatternConfig {
  slots: string[];
  startLength: number;
  /**
   * Constrains which endings the ending/ending2 slots may draw:
   * "CC" = a pure two-consonant coda (e.g. RK, SK); "C" = a single-consonant
   * or syllabic coda (everything else). Omitted = no constraint.
   */
  endingShape?: EndingShape;
}

export interface BlocksConfig {
  starts: string[];
  nuclei: string[];
  endings: string[];
  bridges: string[];
}

export interface LoadedData {
  blocks: BlocksConfig;
  patterns: Record<string, PatternConfig>;
  clusters: Set<string>;
  dictionary: Set<string>;
  blocklist: string[];
  styles: Map<StyleId, StyleConfig>;
}

export interface AssembledCandidate {
  core: string;
  pattern: string;
  /** The start block actually chosen (e.g. "KR"). */
  startBlock: string;
  /** The ending block actually chosen, or "" for patterns without an ending. */
  endBlock: string;
}

export class InvalidOptionsError extends Error {
  readonly code = "InvalidOptionsError" as const;

  constructor(message: string) {
    super(message);
    this.name = "InvalidOptionsError";
  }
}

export class MissingDataError extends Error {
  readonly code = "MissingDataError" as const;

  constructor(message: string) {
    super(message);
    this.name = "MissingDataError";
  }
}

export type FilterRejectReason =
  | "length"
  | "forbidden"
  | "dictionary"
  | "blocklist"
  | "cluster"
  | "duplicate"
  | "score";

export interface FilterResult {
  accepted: boolean;
  reason?: FilterRejectReason;
  score?: number;
}
