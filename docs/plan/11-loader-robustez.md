# 11 — Robustez del loader y validación de datos

**Tipo:** Mejora · **Prioridad:** Baja · **Estado:** Hecho

## Problema

1. **`readJson` traga el error original** (`src/loader.ts:48-53`): un JSON
   inválido reporta solo "Invalid JSON in <path>" sin línea/detalle del
   `SyntaxError`, complicando el diagnóstico al editar datos.
2. **No hay validación de esquema de los datos.** Los `readJson<T>` son casts
   ciegos; datos malformados no fallan al cargar sino en mitad de la
   generación con errores crípticos (o peor, en silencio):
   - pesos negativos o no numéricos en patrones/bloques;
   - slots desconocidos en `patterns.json` (hoy revienta con `Error` genérico
     en `src/assembler.ts:63`, no `MissingDataError`);
   - claves de bloques de estilo inexistentes en la maestra (se ignoran en
     silencio — así se coló el punto 05);
   - `startLength` sin starts de esa longitud en la maestra;
   - patrones referenciados por estilos que no existen en `patterns.json`.

## Solución propuesta

1. `readJson`: encadenar el mensaje original —
   `throw new MissingDataError(\`Invalid JSON in ${path}: ${(err as Error).message}\`)`.
2. Añadir `validateData(data: LoadedData): void`, llamada al final de
   `loadData()`, que verifique como mínimo:
   - `blocks`: arrays no vacíos de strings `A-Z` en los 4 pools;
   - `patterns`: `slots` no vacío, todos los slots conocidos
     (`SLOT_TO_POOL`), `startLength` ≥ 1 con al menos un start maestro de esa
     longitud;
   - por estilo: todos los patrones ponderados existen; todos los pesos son
     números finitos ≥ 0; toda clave de `blocks` de estilo existe en la
     maestra (error, no silencio); al menos un peso > 0 por pool usado;
     `defaults` dentro de los límites globales 3–12;
   - `clusters`: solo consonantes (coordina con el punto 05).
   Todo error → `MissingDataError` con path/clave concretos.
3. Sin dependencias nuevas (nada de zod/ajv): validación manual en el loader,
   son 5 archivos de datos con esquema pequeño y estable.
4. Mover `SLOT_TO_POOL` a un módulo compartido si hace falta para evitar
   dependencia circular assembler↔loader (o duplicar la lista de slots
   válidos como constante en types.ts).

## Archivos afectados

- `src/loader.ts` (y posiblemente `src/types.ts` / `src/assembler.ts` por `SLOT_TO_POOL`)
- `test/loader.test.ts` (nuevo)

## Criterios de aceptación

- [x] Un JSON con sintaxis rota reporta el detalle del `SyntaxError` original (`Invalid JSON in <path>: <detail>`).
- [x] Reglas de `validateData` cubiertas por tests con data-dirs temporales malformados (clave de bloque desconocida, cluster con vocal, patrón inexistente, peso negativo, defaults fuera de límites, JSON roto).
- [x] Los datos reales del repo pasan la validación (test `accepts the real data unchanged`).
- [x] `loadData` sigue cacheando (misma referencia); `setDataDir` invalida; `MissingDataError` con dir inexistente.
- [x] Sin dependencias nuevas; `SLOT_TO_POOL` no se importó (se definió `VALID_SLOTS` local para evitar ciclo assembler↔loader).
