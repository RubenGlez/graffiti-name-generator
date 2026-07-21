# Graffiti Name Generator

A fast, deterministic, procedural generator that produces unique, pronounceable graffiti artist names without AI using style-driven phonetic rules.

---

## Features

- **Procedural and Fast:** Generates hundreds of thousands of unique, high-quality names in milliseconds.
- **Deterministic:** Feed it an optional seed to get the exact same sequence of names every time.
- **Fully Customizable:** Adjust character lengths, prefix/suffix affixes, allow/forbid specific characters, and choose from six distinct graffiti styles.
- **Data-Driven:** Styles, phonetic blocks, allowed patterns, and consonant clusters are fully defined via JSON data files.
- **English Wordlist and offensive filter:** Automatically checks names against a dictionary list of ~9,300 common English words and filters offensive slurs.
- **CLI, Library & Web:** Use the utility library in your TypeScript/JavaScript ESM projects, run it from the command line, or bundle it into a page; the engine has no runtime dependencies and works in the browser.

---

## Project Structure

Detailed specifications are split across the following documents:

| Documentation File | Contents |
|--------------------|----------|
| [graffiti-name-generator-spec.md](./graffiti-name-generator-spec.md) | High-level goal, parameters, and design principles. |
| [architecture.md](./architecture.md) | Repository modules, data-driven architecture, and layout description. |
| [phonetic-system.md](./phonetic-system.md) | Slots (Starts, Nuclei, Endings), assembly patterns, and cluster rules. |
| [styles.md](./styles.md) | Descriptions and JSON schema of the six available styles. |
| [scoring.md](./scoring.md) | Score calculations, bonuses, penalties, and threshold calibrations. |
| [filters-and-wordlists.md](./filters-and-wordlists.md) | Dictionary checks, slur blocklists, and pronounceability parameters. |
| [combinatorics.md](./combinatorics.md) | Estimation calculations for naming pool size and collision statistics. |
| [api.md](./api.md) | API types, error codes, and contract details. |

---

## Installation

Ensure you have **Node.js >= 20** installed.

```bash
npm install
```

---

## Library Usage

The generator is packaged as an ESM module.

```typescript
import { generate } from "@graffiti-name-generator/core";

const result = generate({
  style: "old-school",
  count: 5,
  minLength: 4,
  maxLength: 8,
  seed: 42,
});

console.log(result.names.map(n => `${n.name} (Score: ${n.score})`));
// Output:
// [
//   "TRERAK (Score: 5)",
//   "KOEX (Score: 9)",
//   "TRORK (Score: 5)",
//   "SKAZ (Score: 9)",
//   "DRAK (Score: 2)"
// ]
```

### In the browser

The package entry point reads `data/` from disk, which browsers cannot do. Use
the `browser` entry instead and hand it the data yourself (bundlers can inline
the JSON and text files at build time):

```typescript
import { generate, setDataSource } from "@graffiti-name-generator/core/browser";

setDataSource(() => ({ blocks, patterns, clusters, dictionary, blocklist, styles }));
```

`web/main.js` is a working example. Everything else, including determinism,
behaves exactly as it does in Node.

### Options API

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `style` | `StyleId` | **Required** | `"old-school" \| "modern" \| "wildstyle" \| "tech" \| "minimal" \| "hardcore"` |
| `count` | `number` | `10` | Number of names to generate (range: `1 - 100`) |
| `minLength` | `number` | *per-style* | Minimum length of generated names (range: `3 - 12`) |
| `maxLength` | `number` | *per-style* | Maximum length of generated names (range: `3 - 12`) |
| `pronounceable` | `boolean` | *per-style* (`true`) | When true, rejects unapproved consonant clusters |
| `preferredLetters`| `string` | `""` | Letters to favor. Missing these inflicts a `-2` penalty |
| `forbiddenLetters`| `string` | `""` | Reject names containing any of these characters |
| `prefix` | `string` | `""` | Static prefix prepended to names (max 4 chars) |
| `suffix` | `string` | `""` | Static suffix appended to names (max 4 chars) |
| `seed` | `number` | *random* | Seed value for deterministic output sequence |

When `minLength`, `maxLength` or `pronounceable` are omitted, the selected
style's own defaults apply (e.g. `wildstyle` → 6–10, `minimal` → 3–5); see
[styles.md](./styles.md). Numeric options must be integers.

---

## Command Line Interface (CLI)

Use the built-in generator binary for quick name generation.

### Run via npm script
```bash
npm run generate -- --style old-school --count 5 --seed 42
```

### Options
```text
Usage: graffiti-names generate [options]

Options:
  --style <id>              old-school | modern | wildstyle | tech | minimal | hardcore
  --count <n>               Number of names (default: 10)
  --min-length <n>          Minimum length (default: per-style)
  --max-length <n>          Maximum length (default: per-style)
  --pronounceable           Require pronounceable clusters (default: per-style)
  --no-pronounceable        Allow harsh consonant stacks
  --preferred-letters <s>   Soft letter preference, e.g. KZ
  --forbidden-letters <s>   Hard reject letters, e.g. QW
  --prefix <s>              Prefix up to 4 chars
  --suffix <s>              Suffix up to 4 chars
  --seed <n>                RNG seed for reproducible output
  --format <human|json>     Output format (default: human)
```

### Example Outputs

#### Human Format
```bash
npm run generate -- --style old-school --count 5 --seed 42
```
```text
TRERAK  (score: 5, pattern: CCVC)
KOEX  (score: 9, pattern: CVC)
TRORK  (score: 5, pattern: CCVCC)
SKAZ  (score: 9, pattern: CCVC)
DRAK  (score: 2, pattern: CCVC)
```

#### JSON Format
```bash
npm run generate -- --style old-school --count 5 --seed 42 --format json
```
```json
{
  "names": [
    { "name": "TRERAK", "score": 5, "pattern": "CCVC" },
    { "name": "KOEX", "score": 9, "pattern": "CVC" },
    { "name": "TRORK", "score": 5, "pattern": "CCVCC" },
    { "name": "SKAZ", "score": 9, "pattern": "CCVC" },
    { "name": "DRAK", "score": 2, "pattern": "CCVC" }
  ],
  "meta": {
    "style": "old-school",
    "seed": 42,
    "requested": 5,
    "attempts": 5,
    "rejected": 0,
    "exhausted": false
  }
}
```

---

## Web demo

`web/` is a static single-page demo. The engine and all of its data are bundled
into the page, so it runs entirely client-side: no API, no server, nothing to
keep running once it is published.

```bash
npm run build:web   # bundle into web/dist (git-ignored)
npm run web         # build, then serve web/dist at http://localhost:5713
```

`web/serve.js` exists only for local preview. To deploy, build with
`npm ci && npm run build:web` and publish `web/dist` as static files.

---

## Phonetic Assembly & Scoring

Names are assembled from three slot categories: **Starts** (consonants like `KR`, `SK`, `V`), **Nuclei** (vowels like `A`, `OR`, `AI`), and **Endings** (coda consonants like `ZE`, `X`, `RK`).

### Scoring Criteria
Candidates are scored and filtered:
- **Bonuses:** Letters `K`, `Z`, or `X` (+2 each); starts with `KR`, `SK`, or `TR` (+3); ends with `ZE`, `SK`, or `X` (+3).
- **Style Overrides:** Styles define custom prefixes, suffixes, and letter bonuses which stack with global parameters.
- **Penalties:** Three consecutive vowels (-5); four consecutive consonants (-5); missing all user-preferred letters (-2).
- **Threshold:** Discards candidates scoring below `0` (or style-specific minimums).
- **Hard Rejects:** Exceeding length limits, containing forbidden letters, matching dictionary entries, or matching bad/slur substrings.

---

## Development

### Build
Compiles TypeScript files into ESM JavaScript (`dist/` directory):
```bash
npm run build
```

### Test
Runs the test suite using Node's native test runner (vitest is not required).
Tests compile to `dist-test/` (git-ignored) so the published `dist/` stays
clean:
```bash
npm test
```

### Lint & format
ESLint (type-checked) and Prettier keep the sources consistent:
```bash
npm run lint          # eslint .
npm run format        # prettier --write .
npm run format:check  # prettier --check . (used in CI)
```

### Continuous integration
`.github/workflows/ci.yml` runs lint, format check, build and tests on
Node 20 and 22 for every push to `main` and every pull request.
