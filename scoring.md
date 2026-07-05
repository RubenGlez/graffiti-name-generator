# Scoring

Every candidate receives a numeric score after assembly. Filters (dictionary,
blocklist) run after scoring and can force rejection regardless of score.

## Scale

| Rule | Points | Notes |
|------|--------|-------|
| Contains K | +2 | Once per name (not per occurrence) |
| Contains Z | +2 | Once per name |
| Contains X | +2 | Once per name |
| Starts with KR, SK, or TR | +3 | Longest matching prefix wins; no stacking |
| Ends with ZE, SK, or X | +3 | Suffix match on full candidate |
| Three vowels in a row | −5 | Matches `[AEIOU]{3}` |
| Four consonants in a row | −5 | Matches `[BCDFGHJKLMNPQRSTVWXYZ]{4}` |
| Below min length after trim | reject | Hard reject, no score returned |
| Above max length after trim | reject | Hard reject |
| Contains forbidden letter | reject | Hard reject |
| Dictionary word | reject | Hard reject |
| Offensive term | reject | Hard reject |
| Duplicate in batch | reject | Hard reject; generator retries |

## Acceptance threshold

- **Minimum score:** `0`
- A candidate with score `< 0` is discarded and the generator retries.
- Hard rejects skip scoring entirely.

## Style-specific overrides

Each style JSON may define optional scoring overrides:

```json
{
  "scoring": {
    "threshold": 0,
    "bonusPrefixes": ["KR", "SK"],
    "bonusSuffixes": ["ZE", "X"],
    "bonusLetters": ["K", "Z"]
  }
}
```

If omitted, global rules above apply. Style bonuses **stack** with global
bonuses (e.g. Old School gets +3 for KR start from global rule plus any style
bonus).

## Retry budget

When generating `count` names:

- **Max attempts:** `count × 50` (e.g. 10 names → 500 attempts)
- If fewer than `count` names pass after max attempts, return what was found
  and set `meta.exhausted: true`.

## Calibration examples

Expected outcomes with default rules (pronounceable = true):

| Candidate | Score | Accepted? | Reason |
|-----------|-------|-----------|--------|
| KRAZE | +10 | yes | K(+2), Z(+2), KR start(+3), ZE end(+3) |
| SKONE | +5 | yes | K(+2), SK start(+3) |
| VESK | +5 | yes | K(+2), SK end(+3) |
| AIOU | −5 | no | Three vowels in a row |
| STRNK | +2 | yes | K only; no cluster penalty |
| BRRRK | −3 | no | Four consonants (BRRR) |
| DESK | reject | no | Dictionary word |

## Determinism

Given the same `seed`, style, and options, the same sequence of accepted
names is produced. Rejected candidates do not advance the RNG stream for
block selection — only accepted names consume output slots; retries consume
additional RNG draws.
