# 03 — La pronunciabilidad ignora las fronteras prefijo/sufijo

**Tipo:** Bug · **Prioridad:** Alta · **Estado:** Pendiente · **Depende de:** 09 (recomendado)

## Problema

Con `pronounceable: true`, la validación de clusters (`hasValidClusters`) se
ejecuta solo sobre el `core` generado, no sobre el nombre completo. Un prefijo
o sufijo puede crear secuencias de consonantes no aprobadas en la frontera con
el core y el nombre se acepta igualmente. Contradice `phonetic-system.md`:
"any internal consonant sequence of length ≥ 2 must match an entry in
clusters.json".

## Evidencia (verificada)

```bash
node dist/src/cli.js generate --style hardcore --count 8 --prefix N --seed 3
# NKRURK, NDRUSK, NGRORK, NSTEEX, NSPIRK, NTREIOX, NSTOK, NKRAX
# Clusters NKR, NDR, NGR, NST, NSP, NTR no están en clusters.json,
# pero pronounceable=true (default) los acepta.
```

- `src/filters.ts:140-145` — `checkCandidate` llama a
  `hasValidClusters(core, ...)` en lugar de validar `fullName`
- `src/filters.ts:71-103` — `extractStartAndEndBlocks` re-deriva los bloques
  heurísticamente desde el core (ver punto 09)

## Solución propuesta

Validar los runs de consonantes del **nombre completo**:

1. Ejecutar `getConsonantRuns(fullName)`.
2. Un run es válido si:
   - está en `clusters.json`, o
   - es exactamente el bloque `start` usado y el nombre no tiene prefijo
     (o el prefijo termina en vocal), o
   - es exactamente el bloque `ending` usado y el nombre no tiene sufijo
     (o el sufijo empieza por vocal).
   Es decir: las excepciones de frontera de palabra (starts/endings definen
   sus propios clusters) solo aplican si el bloque sigue estando en la
   frontera real del nombre completo. Si el prefijo convierte el start en una
   secuencia interna (`N` + `KR...` → `NKR`), esa secuencia completa debe
   estar en `clusters.json`.
3. Implementación limpia: hacer primero el punto 09 para que
   `AssembledCandidate` exponga `startBlock`/`endBlock` reales y eliminar la
   heurística de `extractStartAndEndBlocks`.

Nota de alcance: esto hará más difícil (o imposible) generar nombres con
prefijos que terminan en consonante "dura" en estilos de mucho cluster; es el
comportamiento correcto según la spec. `meta.exhausted` ya comunica el caso.
Documentar en `filters-and-wordlists.md` que los prefijos consonánticos
restringen el espacio de nombres con `pronounceable: true`.

## Archivos afectados

- `src/filters.ts` (`checkCandidate`, `hasValidClusters`, eliminar `extractStartAndEndBlocks`)
- `src/generator.ts` (pasar los bloques del candidato al filtro)
- `phonetic-system.md` / `filters-and-wordlists.md` (aclarar semántica de frontera)
- `test/filters.test.ts`

## Criterios de aceptación

- [ ] Con `pronounceable: true`, `--prefix N` sobre `hardcore` no produce nombres con runs tipo `NKR`/`NST` (verificar con seed fija que los candidatos inválidos se rechazan con `reason: "cluster"`).
- [ ] Un prefijo que termina en vocal (p. ej. `LA`) no altera la validación del start (`LAKRO...` sigue siendo válido si `KR` lo era).
- [ ] Un sufijo que empieza por consonante se valida contra el ending (p. ej. core `...RK` + sufijo `S` → run `RKS` debe estar en clusters o rechazarse).
- [ ] `pronounceable: false` sigue sin aplicar ninguna validación de clusters.
- [ ] Tests unitarios nuevos para `hasValidClusters` (o su sustituto) cubriendo los tres casos anteriores.
- [ ] El golden test (seed 42, sin affixes) no cambia.
