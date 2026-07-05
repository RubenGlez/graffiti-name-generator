# 09 — Refactor: el assembler devuelve los bloques reales

**Tipo:** Mejora (habilitadora de 03 y 06) · **Prioridad:** Alta · **Estado:** Pendiente

## Problema

`assembleCandidate` sabe exactamente qué bloques usó (start, nuclei, bridge,
endings), pero solo devuelve `{ core, pattern }`. El filtro necesita conocer
el start y el ending para las excepciones de frontera de la validación de
clusters, y los **re-deriva heurísticamente** en `extractStartAndEndBlocks`
(`src/filters.ts:71-103`):

- Caso especial hardcodeado por nombre de patrón (`if (pattern === "CCVCVC")`,
  línea 84) — se rompe si se añaden patrones nuevos.
- Variable muerta `slots` (línea 86).
- Adivina el ending probando sufijos de longitud 2 y 1 contra la lista
  maestra — ambiguo cuando un sufijo casual coincide con un ending que no fue
  el elegido.
- Duplica conocimiento del assembler en el filtro (acoplamiento frágil).

## Solución propuesta

1. Extender `AssembledCandidate` (`src/types.ts:108-111`):
   ```typescript
   interface AssembledCandidate {
     core: string;
     pattern: string;
     startBlock: string;
     endBlock: string; // "" para patrones sin ending (CV)
   }
   ```
   (Si el punto 06 lo necesita, añadir también `blocks: string[]` con la
   secuencia completa; decidir al implementar.)
2. `assembleCandidate` rellena esos campos con los bloques que realmente
   eligió (los tiene en `parts`; basta con retener el primero y el último
   según el tipo de slot).
3. `checkCandidate` recibe el candidato (o los dos bloques) como parámetro y
   **se elimina `extractStartAndEndBlocks` por completo**, incluida la llamada
   a `loadData()` dentro del filtro (`src/filters.ts:75`).
4. `generate()` (`src/generator.ts:44-55`) pasa los campos nuevos.

Refactor puro: **no debe cambiar ningún output** (la heurística actual acierta
en los datos existentes; el refactor elimina la fragilidad, no corrige
resultados). El golden test debe pasar sin tocar.

Aprovechar para quitar el re-export gratuito de `createRng` en
`src/assembler.ts:80` (los consumidores ya importan de `./rng.js`) — si se
prefiere, esto puede quedarse para el punto 13.

## Archivos afectados

- `src/types.ts`, `src/assembler.ts`, `src/filters.ts`, `src/generator.ts`
- `test/filters.test.ts` (la firma de `checkCandidate` cambia; actualizar los 5 tests que la llaman)

## Criterios de aceptación

- [ ] `extractStartAndEndBlocks` eliminado; ningún caso especial por nombre de patrón en `src/filters.ts`.
- [ ] `checkCandidate` no llama a `loadData()` para derivar bloques.
- [ ] El golden test (seed 42) y los 19 tests existentes pasan sin cambiar expectativas (solo adaptación de firmas).
- [ ] Test nuevo: `assembleCandidate` devuelve `startBlock`/`endBlock` consistentes con `core` para cada patrón (generar N candidatos por estilo y verificar `core.startsWith(startBlock)` / `core.endsWith(endBlock)`).
