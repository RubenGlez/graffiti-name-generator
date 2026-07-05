# 12 — Cobertura de tests transversal

**Tipo:** Mejora · **Prioridad:** Media · **Estado:** Pendiente · **Depende de:** 01–07 (los puntos previos añaden sus propios tests; este cubre lo restante)

## Problema

La suite actual (19 tests) cubre el camino feliz del generador, filtros
básicos y scorer, pero deja sin cubrir precisamente las zonas donde estaban
los bugs de la revisión:

- **CLI**: cero tests (parsing, formatos de salida, exit codes, warning de
  `exhausted` por stderr).
- **Loader**: cero tests (resolución de data dir, caché, `setDataDir`,
  errores de datos).
- **Casos límite del generador**: `exhausted: true`, `count` alto en espacios
  pequeños (minimal), seeds extremos (`0`, `2^31-1`), `forbiddenLetters` que
  chocan con prefix/suffix, `preferredLetters`.
- **Datos**: ninguna verificación de coherencia de los JSON (ver 05 y 11).

## Solución propuesta

Añadir, tras cerrar los puntos 01–07 (para no escribir tests contra
comportamiento que va a cambiar):

1. **`test/cli.test.ts`** — ejecutar el binario compilado con
   `child_process.execFile(process.execPath, [cliPath, ...args])`:
   - golden con seed fija en formato humano y JSON (parsear el JSON y validar estructura completa de `meta`);
   - exit 1 + mensaje para: sin `--style`, estilo inválido, flag desconocida, valor no numérico;
   - warning de `exhausted` por **stderr** (no stdout) con la salida parcial por stdout;
   - `--help` y comando desconocido.
2. **`test/loader.test.ts`** — si no lo creó ya el punto 11: `setDataDir` +
   caché (dos `loadData()` devuelven la misma referencia; `setDataDir` la
   invalida), `MissingDataError` con dir inexistente.
3. **`test/generator.test.ts`** — ampliar:
   - `exhausted: true` real (p. ej. minimal con `count: 100`, `maxLength: 3`, seed fija) y que `names.length < requested`;
   - `seed: 0` es determinista y no se confunde con "sin seed";
   - `forbiddenLetters` que aparece en el prefix → `InvalidOptionsError` (hoy cubierto solo por código, no por test — `src/generator.ts:26-32`);
   - prefix/suffix que fallan `validateAffix` (palabra de diccionario, término del blocklist) → `InvalidOptionsError`;
   - ningún nombre generado contiene términos del blocklist (barrido con varios seeds).
4. Mantener el runner nativo `node --test`; sin frameworks nuevos.
5. Opcional: script `"test:coverage": "node --test --experimental-test-coverage ..."` para visibilidad.

## Archivos afectados

- `test/cli.test.ts` (nuevo), `test/loader.test.ts` (nuevo o ampliado), `test/generator.test.ts`
- `package.json` (script opcional de cobertura)

## Criterios de aceptación

- [ ] Todos los escenarios listados tienen test y la suite completa pasa.
- [ ] Los tests de CLI ejecutan el artefacto compilado real (mismo que usará el usuario final vía `bin`).
- [ ] La suite corre en CI (punto 08) en Node 20 y 22.
