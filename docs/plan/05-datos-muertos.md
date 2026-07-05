# 05 — Datos muertos en la configuración

**Tipo:** Gap · **Prioridad:** Media · **Estado:** Pendiente

## Problema

Hay entradas de configuración que nunca pueden tener efecto y sugieren
intención no implementada:

1. **`data/styles/minimal.json` → starts `"S": 5` y `"T": 0`.** Ninguno de
   los dos existe en la lista maestra `data/blocks.json:starts`, y el
   assembler (`src/assembler.ts:35-38` + filtro `allowed`) descarta en
   silencio las claves de estilo que no están en la maestra. `"S"` (peso 5)
   parece intención real de que minimal use S como start; `"T": 0` además
   tiene peso 0 (filtrado también por `pickWeighted`, `src/rng.ts:20`).
2. **`data/clusters.json` → `ZE`, `EX`, `AK`, `OX`, `IX`.** Contienen
   vocales, y `getConsonantRuns` (`src/filters.ts:20-40`) solo produce runs
   de consonantes, así que esas entradas jamás coinciden con nada. (`RK` sí
   es válido y se queda.)

## Solución propuesta

1. Decidir por entrada de minimal.json:
   - `"S"`: añadir `"S"` a `blocks.json:starts` (es un start razonable y
     otras partes ya lo tratan como consonante válida). Revisar si algún otro
     estilo debería ponderarlo (por defecto, no: solo minimal lo pedía).
   - `"T"`: eliminar la clave (peso 0 y no está en la maestra; doblemente
     muerta).
2. Eliminar `ZE`, `EX`, `AK`, `OX`, `IX` de `clusters.json` y anotar en
   `phonetic-system.md` que clusters.json contiene exclusivamente secuencias
   de consonantes.
3. Añadir validación en el loader que habría detectado esto (se implementa a
   fondo en el punto 11; aquí basta con dejar el dato limpio): claves de
   `blocks` de estilo que no existan en la maestra → error o warning.

## Impacto en output

Añadir `"S"` a la maestra cambia el pool de starts de longitud 1, lo que
puede alterar salidas con seed fija en cualquier estilo **solo si** ese estilo
pondera `"S"` (hoy solo minimal) — el fallback uniforme de `pickBlock`
(`src/assembler.ts:35-36`) únicamente aplica cuando el estilo no define pesos,
y todos los estilos los definen. El golden test (old-school, seed 42) no
debería cambiar; verificarlo.

## Archivos afectados

- `data/blocks.json`
- `data/styles/minimal.json`
- `data/clusters.json`
- `phonetic-system.md`
- `test/generator.test.ts` (verificación golden) y un test de coherencia de datos (ver criterios)

## Criterios de aceptación

- [ ] `minimal` puede generar nombres que empiezan por `S` (verificable con seed fija y count alto).
- [ ] No queda ninguna clave en `blocks` de ningún estilo que no exista en la lista maestra (añadir un test que recorra los 6 estilos y lo compruebe).
- [ ] Todas las entradas de `clusters.json` cumplen `/^[BCDFGHJKLMNPQRSTVWXYZ]+$/` (test).
- [ ] El golden test de seed 42 sigue pasando sin modificar.
