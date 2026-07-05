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

| Pattern | Slots | Start width | Ending shape |
|---------|-------|-------------|--------------|
| CV | start + nucleus | 1 | — (no ending) |
| CVC | start + nucleus + ending | 1 | single/syllabic coda |
| CVCC | start + nucleus + ending | 1 | two-consonant coda (RK, SK) |
| CCVC | start + nucleus + ending | 2 | single/syllabic coda |
| CCVCC | start + nucleus + ending | 2 | two-consonant coda (RK, SK) |
| CCVCVC | start + nucleus + bridge + nucleus + ending | 2 | single/syllabic coda |

`patterns.json` defines which slot types each pattern consumes and, via
`endingShape`, which endings the ending slot may draw:

- **`"CC"`** (`CVCC`, `CCVCC`): the ending must be a pure two-consonant coda —
  `RK` or `SK` — so the name genuinely ends in two consonants. `CVCC` pairs it
  with a single-consonant start (e.g. `VESK`, `NARK`), `CCVCC` with a
  two-consonant start (e.g. `TRORK`).
- **`"C"`** (`CVC`, `CCVC`, `CCVCVC`): the ending is anything *except* a pure
  two-consonant coda — a single consonant (`K`, `X`, `Z`, …) or a syllabic
  coda (`ER`, `ON`, `ZE`, `EX`, …). The trailing `C` denotes one coda slot,
  which may be syllabic; it is not a strict single-phoneme claim.

Both the onset width (`C` vs `CC`) and the coda shape are encoded in the
label, so `pattern` faithfully describes the name's consonant frame.

The assembler does not invent structure — it only fills predefined slots.

## Assembly examples

| Start | Nucleus | Ending | Result | Pattern |
|-------|---------|--------|--------|---------|
| K | OA | — | **KOA** | CV |
| V | E | ZE | **VEZE** | CVC |
| V | E | SK | **VESK** | CVCC |
| KR | EU | S | **KREUS** | CCVC |
| SK | A | RK | **SKARK** | CCVCC |
| SK | I | R + EU + S | **SKIREUS** | CCVCVC |

## Consonant clusters

When `pronounceable: true`, any internal consonant sequence of length ≥ 2 must
match an entry in `clusters.json`. Starts and endings define their own
clusters at word boundaries.

Approved clusters (excerpt):

```
BR, CH, CR, DR, FR, GR, KR, PR, SK, SL, SM, SN, SP, ST, SH, TR, TH,
BL, CL, FL, GL, PL, SC, SCR, SPL, SPR, STR, THR
```

Full list lives in `data/clusters.json`. Every entry is a pure **consonant**
sequence: cluster validation only ever inspects runs of consonants, so
vowel-bearing tokens (endings like `ZE`, `EX`) never belong here.

## Length

Final length = len(prefix) + len(assembled core) + len(suffix).

Must satisfy user `minLength` ≤ length ≤ `maxLength` after assembly.

## Style interaction

Styles do not define new blocks. They reweight which blocks and patterns are
picked. See [styles.md](./styles.md).

## Combinatorics

Estimated viable combinations per style and across the full system:
[combinatorics.md](./combinatorics.md).
