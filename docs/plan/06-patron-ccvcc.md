# 06 — El patrón CCVCC es indistinguible de CCVC

**Tipo:** Gap · **Prioridad:** Media · **Estado:** Hecho · **Depende de:** 09

**Decisión de implementación:** se aplicó el enfoque principal (restringir
endings por patrón vía `endingShape`), no la alternativa de fusionar. `CVCC` y
`CCVCC` usan `endingShape: "CC"` (solo `RK`/`SK`); `CVC`/`CCVC`/`CCVCVC` usan
`"C"` (cualquier ending excepto los CC puros).

**Actualización posterior (a petición del propietario):** la primera versión
solo definía `CCVCC` para codas duras, con lo que los nombres de start simple +
coda dura (tipo `VESK`) dejaban de generarse. Como esa forma C-V-C-C es muy
adecuada para grafiti, se **añadió el patrón `CVCC`** (start de 1 consonante +
vocal + coda `RK`/`SK`) con peso en los seis estilos (5–18 según carácter).
Así se recuperan `VESK`, `NARK`, `XORK`, `KORK`… manteniendo la veracidad de la
etiqueta: todo patrón que acaba en `CC` termina de verdad en dos consonantes.
El golden de old-school seed 42 no cambió (esa secuencia de rolls no selecciona
`CVCC` en los primeros intentos).

## Problema

En `data/patterns.json`, `CCVC` y `CCVCC` tienen exactamente la misma
definición (`slots: ["start", "nucleus", "ending"]`, `startLength: 2`). Nada
obliga a que el ending de `CCVCC` tenga 2 consonantes, así que la etiqueta de
patrón que se reporta en los resultados es arbitraria: el propio `README.md`
muestra `TROM (pattern: CCVCC)` cuando TR+O+M es forma CCVC, y
`KRIZE (pattern: CCVCC)` cuando ZE ni siquiera es un cluster consonántico.

Además la notación no refleja los endings con vocal (`ER`, `ON`, `US`, `ZE`,
`EX`…) ni los nuclei de 2+ caracteres, con lo que "pattern" hoy significa
"receta de slots usada", no "forma fonética del resultado".

## Evidencia

- `data/patterns.json:10-17` — definiciones idénticas
- `phonetic-system.md` (tabla de patrones) — "CCVCC: ending may be 1–2 chars",
  es decir, la propia spec admite la ambigüedad
- README.md:123-127 — ejemplos con etiquetas engañosas

## Solución propuesta

Restringir los pools por patrón para que la etiqueta signifique algo:

1. Extender `PatternConfig` (`src/types.ts:87-90`) con restricción opcional de
   ending, p. ej. `endingShape?: "C" | "CC" | "any"`:
   - `CVC` / `CCVC`: endings de 1 consonante o forma VC (`ER`, `ON`, `AK`…)
     — decidir al implementar si VC-endings cuentan como C; documentarlo.
   - `CCVCC`: solo endings de 2 consonantes (`RK`, `SK`).
2. El assembler filtra el pool de endings según la restricción (mismo
   mecanismo `allowed` que ya usa para starts, `src/assembler.ts:55-58`),
   apoyándose en el refactor del punto 09.
3. Actualizar pesos de estilos si algún patrón se queda con un pool demasiado
   pequeño (CCVCC con solo RK/SK es válido: son los endings más pesados de
   los estilos que más lo usan).
4. Actualizar `phonetic-system.md` (tabla de patrones y ejemplos) y el README.

Alternativa (si se prefiere no tocar datos): eliminar `CCVCC` y fusionar sus
pesos con `CCVC`. Menos expresivo; solo elegir si la opción principal complica
demasiado los datos. Anotar la elección aquí al implementar.

## Impacto en output

Cambia la distribución de endings para patrones CCVCC ⇒ **el golden test de
seed 42 cambiará** (TROM y KRIZE salían etiquetados CCVCC). Regenerar el
golden y actualizar README/api.md con la nueva salida en el mismo commit.

## Archivos afectados

- `data/patterns.json`, posiblemente `data/blocks.json` (clasificación de endings)
- `src/types.ts`, `src/assembler.ts`
- `phonetic-system.md`, `README.md`, `api.md` (ejemplos)
- `test/generator.test.ts` (golden), tests nuevos

## Criterios de aceptación

- [x] Todo nombre reportado con `pattern: "CCVCC"` termina en 2 consonantes (verificado sobre 3600 nombres: 0 fallos).
- [x] Los endings de `CVC`/`CCVC`/`CCVCVC` nunca son codas CC puras (`RK`/`SK`); forma documentada en `phonetic-system.md`.
- [x] `phonetic-system.md` describe `endingShape` y coincide con `patterns.json`; ejemplos de ensamblaje reemplazados por nombres reales generables.
- [x] Golden test regenerado (TRERAK, KOEX, TRORK, SKAZ, DRAK) y README/api.md actualizados con la misma salida.
- [x] Test nuevo que verifica la coherencia etiqueta↔forma para CCVCC en los 6 estilos.
