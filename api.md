# API Contract

## Runtime

- **Language:** TypeScript (strict)
- **Package:** `@graffiti-name-generator/core` (library) + CLI binary `graffiti-names`
- **Module format:** ESM
- **Node:** ≥ 20

Rationale: TypeScript keeps the generator portable for a future web UI and tag
preview without rewriting logic.

## Types

```typescript
type StyleId =
  | "old-school"
  | "modern"
  | "wildstyle"
  | "tech"
  | "minimal"
  | "hardcore";

interface GenerateOptions {
  /** Inclusive. Default: 4 */
  minLength?: number;
  /** Inclusive. Default: 8 */
  maxLength?: number;
  /** Default: 10. Max: 100 */
  count?: number;
  /** Default: true */
  pronounceable?: boolean;
  /** Letters to favor (soft). Example: "KZ" */
  preferredLetters?: string;
  /** Letters that hard-reject. Example: "QW" */
  forbiddenLetters?: string;
  /** Prepended before generated core. Max 4 chars */
  prefix?: string;
  /** Appended after generated core. Max 4 chars */
  suffix?: string;
  style: StyleId;
  /** Optional seed for reproducible output */
  seed?: number;
}

interface GeneratedName {
  name: string;
  score: number;
  pattern: string; // e.g. "CCVC"
}

interface GenerateResult {
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
```

## Validation defaults and limits

| Field | Default | Min | Max |
|-------|---------|-----|-----|
| minLength | per-style (see below) | 3 | 12 |
| maxLength | per-style (see below) | 3 | 12 |
| pronounceable | per-style (all styles: `true`) | — | — |
| count | 10 | 1 | 100 |

When `minLength` / `maxLength` / `pronounceable` are omitted, the chosen
style's `defaults` apply. Explicit options always override them.

| Style | Default minLength | Default maxLength |
|-------|-------------------|-------------------|
| old-school | 4 | 7 |
| modern | 4 | 8 |
| wildstyle | 6 | 10 |
| tech | 4 | 7 |
| minimal | 3 | 5 |
| hardcore | 5 | 9 |

- `minLength`, `maxLength`, `count` and `seed` must be **integers**; a
  non-integer or `NaN` throws `InvalidOptionsError`
- `minLength` must be ≤ `maxLength` or throw `InvalidOptionsError`
- `prefix` + core + `suffix` must fit within min/max length together;
  `prefix` + `suffix` must leave at least **2** characters for the generated
  core (the shortest possible core) or throw `InvalidOptionsError`
- All string inputs normalized to uppercase before generation

## Library usage

```typescript
import { generate } from "@graffiti-name-generator/core";

const result = generate({
  style: "old-school",
  count: 5,
  minLength: 4,
  maxLength: 7,
  pronounceable: true,
  preferredLetters: "KZ",
  seed: 42,
});

console.log(result.names.map((n) => n.name));
// ["TRERAK", "KOEX", "TRORK", "SKAZ", "DRAK"]
```

## CLI

```bash
graffiti-names generate \
  --style old-school \
  --count 10 \
  --min-length 4 \
  --max-length 8 \
  --pronounceable \
  --preferred-letters KZ \
  --seed 42
```

### CLI output formats

**Default (human):**

```
TRERAK  (score: 5, pattern: CCVC)
KOEX  (score: 9, pattern: CVC)
TRORK  (score: 5, pattern: CCVCC)
...
```

**JSON (`--format json`):**

```json
{
  "names": [
    { "name": "TRERAK", "score": 5, "pattern": "CCVC" },
    { "name": "KOEX", "score": 9, "pattern": "CVC" }
  ],
  "meta": {
    "style": "old-school",
    "seed": 42,
    "requested": 10,
    "attempts": 13,
    "rejected": 3,
    "exhausted": false
  }
}
```

## Errors

| Code | When |
|------|------|
| `InvalidOptionsError` | Bad lengths, count, unknown style |
| `MissingDataError` | Style or data JSON not found on disk |

## Out of scope for MVP

- HTTP server / REST API
- Authentication
- Rate limiting
- Cross-request duplicate tracking
- Username / domain availability checks
