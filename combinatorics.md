# Combinatorics

## Block inventory (global)

| Slot | Count | Examples |
|------|-------|----------|
| Starts | 20 | KR, SK, TR, V, X |
| Nuclei | 11 | A, O, AR, AI |
| Endings | 18 | ZE, SK, X, RK |
| Patterns | 5 | CV, CVC, CCVC, CCVCC, CCVCVC |

## Raw combinations per pattern

Approximate independent picks (before filters):

| Pattern | Formula | ~Combinations |
|---------|---------|---------------|
| CV | start × nucleus | 20 × 11 = **220** |
| CVC | start × nucleus × ending | 20 × 11 × 18 = **3 960** |
| CCVC | cluster start × nucleus × ending | ~15 × 11 × 18 = **2 970** |
| CCVCC | cluster × nucleus × coda | ~15 × 11 × 15 = **2 475** |
| CCVCVC | two syllables | ~15 × 11 × 11 × 18 = **3 267** |

**Per style** (mixing patterns by weight): roughly **8 000–12 000** raw
candidates before length, dictionary, and score filters.

## Across styles and options

| Dimension | Factor |
|-----------|--------|
| 6 styles | ×6 |
| Length window (e.g. 4–8) | ~×1.5 effective (filters trim space) |
| Prefix (36² combos, 2 chars) | optional multiplier |
| Suffix | optional multiplier |
| pronounceable on/off | ~×1.3 (off adds valid-but-harsh names) |

**Conservative estimate:** 6 × 10 000 × 1.5 ≈ **90 000** distinct viable
names after basic length filtering.

**With prefix/suffix and relaxed pronounceable:** easily **500 000+**
theoretical outputs.

**"Millions" claim:** Achievable when including:

- All length windows (3–12)
- Both pronounceable modes
- Optional 1–4 char prefix/suffix from alphanumeric set
- Style weight variations

For marketing copy, use: *"hundreds of thousands of unique names out of the
box; millions with prefix/suffix customization."*

## Practical generation limits

| Limit | Value | Reason |
|-------|-------|--------|
| Max `count` per request | 100 | Prevent long retry loops |
| Max attempts | `count × 50` | Bound worst-case latency |
| Target latency | < 50 ms for 100 names | Single-threaded Node on laptop |

## Collision probability

Generating 100 names from a pool of ~90 000 viable names: birthday-paradox
collision risk is negligible (< 0.01%). Duplicate detection within batch is
still required for correctness.

## Seed space

Use a 32-bit mulberry32 or similar PRNG. Seed range: `[0, 2³¹ − 1]`.
Default seed when omitted: derived from `Date.now()` (non-deterministic) or
`0` in tests.
