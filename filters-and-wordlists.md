# Filters and Wordlists

## Filter order

Apply in this order after assembly and length check:

1. **Forbidden letters** — any character in `forbiddenLetters` (case-insensitive)
2. **Preferred letters** — soft constraint; see below
3. **Dictionary** — exact match, case-insensitive
4. **Blocklist** — substring match, case-insensitive
5. **Duplicate** — exact match within current batch
6. **Score threshold** — score ≥ 0

## Preferred letters (soft constraint)

`preferredLetters` does not reject candidates. Instead:

- If the name contains **at least one** preferred letter → no change
- If it contains **none** → score −2 (can still pass if other bonuses compensate)

This nudges output toward user preference without empty results.

## Pronounceable mode

### `pronounceable: true` (default)

- Candidate **must** be built from an allowed pattern in `patterns.json`
- Only use starts, nuclei, and endings listed in `blocks.json`
- Internal consonant clusters must appear in the approved cluster list:

  `BR, CH, CR, DR, FR, GR, KR, PR, SK, SL, SM, SN, SP, ST, SH, TR, TH, BL, CL, FL, GL, PL, PR, SC, SCR, SPL, SPR, STR, THR`

- Reject any candidate with an unlisted consonant cluster of length ≥ 2
  (except at start/end positions where start/end blocks define the cluster)

### `pronounceable: false`

- Same pattern assembly, but cluster validation is **disabled**
- Allows harsher, less readable combinations (Wildstyle / Hardcore feel)
- Dictionary and blocklist filters still apply

## Dictionary wordlist

| Property | Value |
|----------|-------|
| File | `data/dictionary-en.txt` |
| Language | English |
| Match | Exact, whole word, case-insensitive |
| Length scope | Words of 3–12 characters only (file is pre-filtered) |
| Source | [dwyl/english-words](https://github.com/dwyl/english-words) `words_alpha.txt`, filtered |
| Size | ~8 000 common short words |
| MVP note | Static file committed to repo; no runtime download |

**Not in MVP:** Spanish or other language dictionaries. Names may *look*
Spanish (e.g. ending in -ON) but only English dictionary words are rejected.

## Offensive blocklist

| Property | Value |
|----------|-------|
| File | `data/blocklist.txt` |
| Match | Substring, case-insensitive |
| Source | Curated merge of LDNOOBW (English) slurs + graffiti-irrelevant noise words |
| Size | ~400 terms |
| MVP note | Static file; one term per line; `#` comments allowed |

A candidate is rejected if **any** blocklist term appears as a substring.
This catches embedded slurs inside longer names (e.g. `XXSLURXX`).

## Prefix and suffix

- Applied **after** block assembly, **before** length check
- Normalized to uppercase
- Must themselves pass forbidden-letter and blocklist checks
- Do not bypass dictionary check on the full assembled string

Example: prefix `MC` + blocks `RAZE` → `MCRAZE` (full string checked).

### Affixes and pronounceability

When `pronounceable: true`, cluster validation runs over the **full**
prefix+core+suffix string, not just the generated core. Word-boundary
exceptions (the start/end block being its own onset/coda cluster) only apply
when the boundary is *clean*:

- The **start** exception applies only if the prefix is empty or ends in a
  vowel. A consonant-ending prefix merges with the core's start block into an
  internal junction (e.g. prefix `N` + core `KRURK` → run `NKR`) that must
  itself be an approved cluster, or the candidate is rejected.
- The **end** exception applies only if the suffix is empty or starts with a
  vowel. A consonant-starting suffix merges with the core's ending (e.g. core
  `...RK` + suffix `S` → run `RKS`) and is validated the same way.

Consequence: a consonant-ending prefix on a cluster-heavy style (e.g.
`--prefix N --style hardcore`, whose cores nearly always open with a
two-consonant cluster) can leave **no** pronounceable candidates; the run then
reports `exhausted: true` and the CLI prints a warning. Use a vowel-ending
prefix, a lighter style, or `--no-pronounceable` in that case.

## Duplicate handling

- **Within batch:** track `Set<string>` of accepted uppercase names
- **Across sessions:** out of scope for MVP; no persistence
- On duplicate, retry without counting toward `count`
