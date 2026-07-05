# 02 — Validación numérica: NaN y no-enteros se saltan los límites

**Tipo:** Bug · **Prioridad:** Alta · **Estado:** Hecho

## Problema

`normalizeOptions` valida los rangos con comparaciones (`minLength < MIN_LEN`,
`count > MAX_COUNT`…) que son `false` cuando el valor es `NaN`, así que un
`NaN` pasa toda la validación. El CLI convierte con `Number(...)` sin
comprobar el resultado, por lo que cualquier valor no numérico llega como
`NaN` al core. Tampoco se rechazan valores no enteros (`5.5`).

## Evidencia (verificada)

```bash
node dist/src/cli.js generate --style modern --min-length abc --count 3 --seed 5
# -> genera "MU" (2 letras): NaN desactiva por completo el filtro de longitud,
#    por debajo incluso del mínimo absoluto de 3.

node dist/src/cli.js generate --style modern --count abc
# -> salida vacía, exit 0, sin ningún error (while names.length < NaN nunca itera).
```

- `src/options.ts:29-43` — comparaciones que no capturan `NaN`
- `src/options.ts:68` — `seed` tampoco se valida
- `src/cli.ts:67-79` — `Number(args.X)` sin validación
- `src/filters.ts:114-118` — con `NaN` en min/max, el check de longitud
  siempre acepta

## Solución propuesta

Validar en el core (fuente de verdad), no solo en el CLI:

1. En `src/options.ts`, añadir un helper:
   ```typescript
   function requireInt(value: number, field: string, min: number, max: number): number {
     if (!Number.isInteger(value) || value < min || value > max) {
       throw new InvalidOptionsError(`${field} must be an integer between ${min} and ${max}`);
     }
     return value;
   }
   ```
   y usarlo para `minLength`, `maxLength` y `count`. Para `seed`, exigir
   `Number.isInteger(seed)` cuando venga informado (rango: enteros ≥ 0;
   documentar que internamente se trunca a 32 bits en `createRng`).
2. El CLI puede seguir pasando `Number(...)`: el core ya rechazará `NaN` con
   un mensaje claro y exit 1 (el `catch` de `cli.ts:113-119` ya existe).
   Opcionalmente mejorar el mensaje en CLI indicando el flag original
   (esto queda cubierto de forma natural por el punto 10, `util.parseArgs`).
3. Actualizar `api.md` (sección "Validation defaults and limits") indicando
   que los campos numéricos deben ser enteros.

## Archivos afectados

- `src/options.ts`
- `api.md`
- `test/generator.test.ts` (o nuevo `test/options.test.ts`)

## Criterios de aceptación

- [x] `normalizeOptions({ style: "modern", minLength: NaN })` lanza `InvalidOptionsError`.
- [x] Ídem para `maxLength: NaN`, `count: NaN`, `seed: NaN`, y para valores no enteros (`minLength: 4.5`).
- [x] `graffiti-names generate --style modern --count abc` termina con exit 1 y mensaje `Error: ...`.
- [x] `graffiti-names generate --style modern --min-length abc` termina con exit 1 (ya no genera nombres de 2 letras).
- [x] Tests nuevos cubriendo los casos anteriores; los 19 tests existentes siguen pasando.
