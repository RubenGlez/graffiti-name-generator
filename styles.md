# Styles

Six styles, one JSON file each under `data/styles/`. All share the same
phonetic blocks from `data/blocks.json`; styles differ by pattern weights,
block weights, and scoring nudges.

## Style profiles

| Style | ID | Length bias | Pattern bias | Character |
|-------|-----|-------------|--------------|-----------|
| Old School | `old-school` | 4–7 | CVC, CCVC | Classic 80s: KR/SK starts, ZE/X endings |
| Modern | `modern` | 4–8 | CV, CVC | Clean, readable, balanced vowels |
| Wildstyle | `wildstyle` | 6–10 | CCVCC, CCVCVC | Long, complex, more consonants |
| Tech | `tech` | 4–7 | CVC, CCVC | Sharp: X, K, Z heavy |
| Minimal | `minimal` | 3–5 | CV, CVC | Short, simple, fewer clusters |
| Hardcore | `hardcore` | 5–9 | CCVC, CCVCC | Aggressive consonant stacks |

Default min/max in each style JSON are **suggestions**; user `minLength` /
`maxLength` override them when provided.

## Style JSON schema

```json
{
  "id": "old-school",
  "label": "Old School",
  "defaults": {
    "minLength": 4,
    "maxLength": 7,
    "pronounceable": true
  },
  "patterns": {
    "CV": 10,
    "CVC": 30,
    "CCVC": 35,
    "CCVCC": 20,
    "CCVCVC": 5
  },
  "blocks": {
    "starts": { "KR": 20, "SK": 20, "TR": 15, "DR": 10, "..." : 1 },
    "nuclei": { "A": 20, "O": 20, "E": 15, "..." : 1 },
    "endings": { "ZE": 20, "SK": 15, "X": 15, "K": 10, "..." : 1 }
  },
  "scoring": {
    "threshold": 0,
    "bonusPrefixes": ["KR", "SK"],
    "bonusSuffixes": ["ZE", "X"]
  }
}
```

Weights are relative integers; generator normalizes to probabilities at load
time.

## Per-style notes

### Old School

- Favor `KR`, `SK`, `TR` starts and `ZE`, `SK`, `X` endings
- Best default for first MVP implementation

### Modern

- Even spread across starts/nuclei/endings
- Lower weight on `CCVCC` and `CCVCVC`

### Wildstyle

- Highest weight on longest patterns
- Recommend `pronounceable: false` for authentic output, but default stays
  `true` for approachability

### Tech

- Boost `X`, `K`, `Z` in block weights and letter bonuses
- Endings: `EX`, `OX`, `IX`, `AK`

### Minimal

- Restrict to `CV` and `CVC` only
- Single-char starts (K, V, Z, N, R, M) weighted higher than clusters

### Hardcore

- Similar to Wildstyle but shorter max length cap
- Boost hard consonants: K, X, Z, RK, SK
- Higher tolerance for low scores — threshold stays 0 but pattern weights
  favor dense consonant patterns

## MVP phasing

| Phase | Styles shipped |
|-------|----------------|
| MVP | `old-school`, `modern` |
| v0.2 | `tech`, `minimal` |
| v0.3 | `wildstyle`, `hardcore` |

All six JSON files are authored before MVP coding begins so the loader and
schema are validated once; only two styles need tuning during QA.
