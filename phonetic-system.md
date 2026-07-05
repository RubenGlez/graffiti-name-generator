# Phonetic System

## Block slots

Every name is assembled from three slot types:

| Slot | Role | Example values |
|------|------|----------------|
| **Start** | Opening consonant(s) | KR, SK, V, X |
| **Nucleus** | Vowel core | A, O, AR, AI |
| **Ending** | Closing consonant(s) | ZE, SK, X, RK |

## Starts

```
K, KR, SK, TR, DR, GR, BR, ST, SP, SM, SN, SH, CH, V, X, Z, N, R, M
```

Single-letter starts are treated as `C`; digraphs as `CC` in patterns.

## Nuclei

```
A, E, I, O, U, AR, ER, OR, AI, EI, OA
```

All count as `V` in pattern notation (some are multichar vowel teams).

## Endings

```
K, X, Z, S, R, N, M, RK, SK, ZE, EX, ON, ER, EN, AK, OX, IX, US
```

## Patterns

Pattern notation maps to slot picks:

| Pattern | Slots | Structure |
|---------|-------|-----------|
| CV | start + nucleus | e.g. V + E → **VE** |
| CVC | start + nucleus + ending | e.g. V + E + SK → **VESK** |
| CCVC | start + nucleus + ending | start must be 2-char cluster |
| CCVCC | start + nucleus + ending | ending may be 1–2 chars |
| CCVCVC | start + nucleus + ending + nucleus + ending | two syllables |

`patterns.json` defines which slot types each pattern consumes. The assembler
does not invent structure — it only fills predefined slots.

## Assembly examples

| Start | Nucleus | Ending | Result | Pattern |
|-------|---------|--------|--------|---------|
| KR | A | ZE | **KRAZE** | CCVC |
| SK | O | NE | **SKONE** | CCVC |
| V | E | SK | **VESK** | CVC |
| TR | AI | X | **TRAIX** | CCVC |
| ST | O | RK | **STORK** | CCVC |

## Consonant clusters

When `pronounceable: true`, any internal consonant sequence of length ≥ 2 must
match an entry in `clusters.json`. Starts and endings define their own
clusters at word boundaries.

Approved clusters (excerpt):

```
BR, CH, CR, DR, FR, GR, KR, PR, SK, SL, SM, SN, SP, ST, SH, TR, TH,
BL, CL, FL, GL, PL, SC, SCR, SPL, SPR, STR, THR
```

Full list lives in `data/clusters.json`.

## Length

Final length = len(prefix) + len(assembled core) + len(suffix).

Must satisfy user `minLength` ≤ length ≤ `maxLength` after assembly.

## Style interaction

Styles do not define new blocks. They reweight which blocks and patterns are
picked. See [styles.md](./styles.md).

## Combinatorics

Estimated viable combinations per style and across the full system:
[combinatorics.md](./combinatorics.md).
