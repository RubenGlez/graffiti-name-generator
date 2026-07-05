# 04 — Aplicar los `defaults` por estilo

**Tipo:** Gap spec/código · **Prioridad:** Media · **Estado:** Hecho · **Depende de:** 02

**Decisión tomada por el propietario (no re-litigar):** los `defaults` del
JSON de cada estilo se aplican cuando el usuario no pasa
`minLength` / `maxLength` / `pronounceable`. Es la semántica que describe
`styles.md`. Se asume el cambio de comportamiento (breaking menor).

## Problema

Todos los JSON de estilo definen `defaults` (`minLength`, `maxLength`,
`pronounceable`) y `styles.md` dice que aplican cuando el usuario no los pasa,
pero `normalizeOptions` usa siempre 4/8/`true` fijos. El campo está muerto y
las dos specs se contradicen (`api.md` documenta 4/8 fijo).

## Evidencia (verificada)

```bash
node dist/src/cli.js generate --style wildstyle --count 8 --seed 3
# -> XERK, SKEZ (4 letras) pese a que wildstyle declara defaults 6–10.
# minimal (3–5) tampoco se respeta: recibe 4–8.
```

- `src/options.ts:23-24` — `options.minLength ?? 4`, `options.maxLength ?? 8`
- `src/options.ts:62` — `options.pronounceable ?? true`
- `src/types.ts:72-76` — `StyleConfig.defaults` se carga pero nadie lo lee
- `styles.md` ("Default min/max in each style JSON are suggestions; user
  minLength/maxLength override them when provided") vs `api.md:65-72`

## Solución propuesta

1. `normalizeOptions` necesita acceso al `StyleConfig`. Opciones:
   - Cambiar la firma a `normalizeOptions(options, styleDefaults)` y que
     `generate()` (src/generator.ts:14-16) cargue el estilo antes de
     normalizar; o
   - mover la resolución de defaults a `generate()`.
   Preferida: pasar `style.defaults` como segundo argumento; mantiene
   `normalizeOptions` pura y testeable.
2. Resolución: `options.minLength ?? style.defaults.minLength`, ídem
   `maxLength` y `pronounceable`. Los límites globales (3–12) siguen
   aplicando después.
3. CLI: sin cambios de flags. Ojo con `runGenerate` (src/cli.ts:62-63): hoy
   calcula `pronounceable` incondicionalmente, con lo que siempre lo pasa
   informado. Debe pasar `undefined` cuando el usuario no usó ni
   `--pronounceable` ni `--no-pronounceable`, para que el default del estilo
   pueda aplicar.
4. Documentación en el mismo commit:
   - `api.md`: la tabla de defaults pasa de valores fijos a "default del
     estilo" con la tabla por estilo.
   - `README.md`: tabla de opciones y textos de ayuda del CLI
     (`src/cli.ts:36-51`): "default: 4/8" → "default: según estilo".
   - `styles.md`: ya es correcta; revisar que no haya más menciones a 4/8.

## Archivos afectados

- `src/options.ts`, `src/generator.ts`, `src/cli.ts`
- `api.md`, `README.md`
- `test/generator.test.ts`, `test/scorer.test.ts` (sin cambios esperados), nuevos tests

## Criterios de aceptación

- [x] `generate({ style: "wildstyle", seed: N })` sin longitudes produce solo nombres de 6–10 caracteres.
- [x] `generate({ style: "minimal", seed: N })` sin longitudes produce solo nombres de 3–5 caracteres.
- [x] Pasar `minLength`/`maxLength` explícitos sigue teniendo prioridad sobre el estilo.
- [x] `--no-pronounceable` en CLI sigue funcionando; sin flags, aplica el default del estilo (CLI pasa `undefined`).
- [x] El golden test (seed 42) no cambia porque pasa longitudes explícitas; añadidos tests de rango por estilo (wildstyle/minimal) y de override explícito.
- [x] `api.md`, `README.md` y la ayuda del CLI actualizados y coherentes entre sí.
