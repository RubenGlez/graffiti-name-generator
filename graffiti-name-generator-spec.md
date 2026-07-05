# Graffiti Name Generator

## Goal

Generate graffiti artist names without AI using procedural phonetic rules.

## Principles

- Fast and deterministic (with optional seed)
- Configurable via JSON data files
- Hundreds of thousands of unique names; millions with prefix/suffix
- Style-driven generation

## Documentation map

| Doc | Contents |
|-----|----------|
| [architecture.md](./architecture.md) | Folder layout, modules, data files |
| [phonetic-system.md](./phonetic-system.md) | Blocks, patterns, assembly |
| [styles.md](./styles.md) | Six styles, JSON schema, MVP phasing |
| [scoring.md](./scoring.md) | Numeric rules, threshold, retries |
| [filters-and-wordlists.md](./filters-and-wordlists.md) | Pronounceable mode, dictionary, blocklist |
| [combinatorics.md](./combinatorics.md) | Combination estimates, limits |
| [api.md](./api.md) | TypeScript types, CLI, JSON output |

## User parameters

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| minLength | number | 4 | 3–12 |
| maxLength | number | 8 | 3–12 |
| count | number | 10 | 1–100 |
| pronounceable | boolean | true | See [filters-and-wordlists.md](./filters-and-wordlists.md) |
| preferredLetters | string | — | Soft bonus; at least one preferred or −2 score |
| forbiddenLetters | string | — | Hard reject |
| prefix | string | — | Max 4 chars, applied before filters |
| suffix | string | — | Max 4 chars |
| style | StyleId | required | See [styles.md](./styles.md) |
| seed | number | random | Reproducible output when set |

## Generation pipeline

1. Validate and normalize options.
2. Load style JSON and shared data files.
3. Select pattern (weighted by style).
4. Pick weighted phonetic blocks and assemble candidate.
5. Apply prefix/suffix.
6. Hard filters: length, forbidden letters, dictionary, blocklist.
7. Score candidate; apply preferred-letters penalty if needed.
8. Reject if below threshold, duplicate, or hard-filtered.
9. Retry until `count` reached or attempt budget exhausted.
10. Return results with metadata.

## Scoring (summary)

Full rules in [scoring.md](./scoring.md).

- **Bonuses:** K/Z/X (+2 each), KR/SK/TR start (+3), ZE/SK/X end (+3)
- **Penalties:** 3 vowels (−5), 4 consonants (−5), no preferred letter (−2)
- **Hard reject:** dictionary word, offensive substring, forbidden letter
- **Threshold:** score ≥ 0

## Pre-development checklist

- [x] Pronounceable mode defined
- [x] Scoring numeric values and threshold
- [x] Wordlist source, size, and match rules
- [x] Offensive blocklist approach
- [x] All 6 styles mapped to JSON files
- [x] Combinatorics and "millions" claim grounded
- [x] API types, CLI, and output format
- [x] MVP scope (2 styles first, 4 data-driven modules)
- [x] Retry budget and duplicate handling
- [x] Determinism with seed

## Future ideas

- Availability checks (Instagram, domains)
- Tag preview / throw-up / piece generation
- Style packs (downloadable JSON)
- HTTP API wrapper
- Additional language dictionaries
