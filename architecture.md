# Architecture

## Overview

Data-driven procedural generator. All phonetic and stylistic behavior lives in
JSON; TypeScript code is a thin engine that loads config, assembles, scores,
and filters.

```
Input → Validate → Style → Pattern → Blocks → Assemble → Prefix/Suffix
  → Filter → Score → Accept/Reject → Output
```

## Repository layout

```
graffiti-name-generator/
├── data/
│   ├── blocks.json           # Shared starts, nuclei, endings
│   ├── patterns.json         # Pattern definitions (CV, CVC, …)
│   ├── clusters.json         # Approved consonant clusters
│   ├── dictionary-en.txt     # ~8k English words, length 3–12
│   ├── blocklist.txt         # ~400 offensive substrings
│   └── styles/
│       ├── old-school.json
│       ├── modern.json
│       ├── wildstyle.json
│       ├── tech.json
│       ├── minimal.json
│       └── hardcore.json
├── src/
│   ├── index.ts              # Node entry: generate() + filesystem data
│   ├── browser.ts            # Browser entry: generate() + injected data
│   ├── generator.ts          # Main loop, retry budget
│   ├── assembler.ts          # Pattern → block picks → string
│   ├── scorer.ts             # Numeric scoring
│   ├── filters.ts            # Dictionary, blocklist, clusters, duplicates
│   ├── loader.ts             # Validate and cache data (no I/O)
│   ├── loader-node.ts        # Filesystem data source
│   ├── rng.ts                # Seeded mulberry32 PRNG
│   ├── types.ts              # GenerateOptions, GenerateResult, etc.
│   └── cli.ts                # `graffiti-names` binary
├── test/
│   ├── generator.test.ts     # Golden tests with fixed seeds
│   ├── scorer.test.ts
│   └── filters.test.ts
├── web/                      # Static demo (bundled, client-side only)
├── scripts/build-web.js      # esbuild bundle → web/dist
├── package.json
└── tsconfig.json
```

## Data files

| File | Purpose |
|------|---------|
| `blocks.json` | Master list of starts, nuclei, endings |
| `patterns.json` | Maps pattern id → slot sequence (e.g. CCVC → [start, nucleus, ending]) |
| `clusters.json` | Allowed internal consonant digraphs/trigraphs |
| `styles/*.json` | Per-style pattern and block weights + scoring overrides |
| `dictionary-en.txt` | One word per line |
| `blocklist.txt` | One term per line; `#` comments |

Style JSON references block keys from `blocks.json`; it does not duplicate
block strings, only weights.

## Modules

### `loader`

- Parses, validates and caches the data on the first `generate()` call
- Validates JSON schema; throws `MissingDataError` on bad/missing files
- Holds no I/O of its own: a data source is registered via `setDataSource()`,
  so the same engine runs on Node (`loader-node` reads `data/`) and in the
  browser (the host passes bundled data). Entry points wire this up; importing
  `generator` alone leaves no source registered.

### `assembler`

- Picks pattern from style weights
- Picks blocks from style block weights (fallback to uniform if key missing)
- Concatenates uppercase string

### `filters`

- Order defined in [filters-and-wordlists.md](./filters-and-wordlists.md)
- Dictionary loaded into `Set` for O(1) lookup
- Blocklist checked as substring scan (400 terms is fine for MVP)

### `scorer`

- Implements rules from [scoring.md](./scoring.md)
- Style-specific bonus overrides

### `generator`

- Orchestrates pipeline
- Manages attempt budget (`count × 50`)
- Tracks duplicates within batch

### `rng`

- Mulberry32 seeded PRNG
- Same seed + options → same output sequence

## Configuration without code changes

To tune a style: edit `data/styles/<style>.json` weights only.

To add a new ending: add to `blocks.json`, then add weight in relevant style
JSON files.

To adjust global scoring: edit `scoring.md` rules in code **or** add
`data/rules.json` in v0.2 (optional; not MVP).

## MVP scope

| In MVP | Deferred |
|--------|----------|
| Library + CLI | HTTP server |
| `old-school`, `modern` styles | `wildstyle`, `hardcore` tuning |
| Static EN dictionary + blocklist | ES/other languages |
| Seeded determinism | Persistent duplicate store |
| JSON CLI output | Tag preview UI |

## Tech stack

- TypeScript 5, strict mode
- Node ≥ 20, ESM
- Test runner: `node:test` (no extra deps) or Vitest if preferred during setup
- Zero runtime dependencies for core generator

See [api.md](./api.md) for public types and CLI interface.
