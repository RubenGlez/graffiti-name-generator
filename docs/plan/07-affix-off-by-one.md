# 07 — Off-by-one en la validación de longitud de affixes

**Tipo:** Gap · **Prioridad:** Baja · **Estado:** Pendiente

## Problema

`normalizeOptions` valida `affixLen >= maxLength` (`src/options.ts:53-55`),
permitiendo `prefix.length + suffix.length === maxLength - 1`. Pero el core
más corto posible son 2 caracteres (patrón CV = start de 1 + nucleus de 1),
así que con solo 1 hueco disponible **ningún** candidato puede cumplir
`maxLength` y `generate()` quema silenciosamente `count * 50` intentos para
devolver 0 nombres con `exhausted: true`.

Ejemplo: `maxLength: 5`, `prefix: "AB"`, `suffix: "CD"` (affixLen 4) → core
máximo de 1 char → imposible.

## Solución propuesta

1. Definir `MIN_CORE = 2` en `src/options.ts` y cambiar la validación a:
   ```typescript
   if (affixLen > maxLength - MIN_CORE) {
     throw new InvalidOptionsError(
       `prefix + suffix leave no room for generated core (need at least ${MIN_CORE} characters)`,
     );
   }
   ```
2. Documentar en `api.md` la regla exacta ("prefix + suffix must leave at
   least 2 characters for the core").

Nota: no acoplarlo a los patrones activos del estilo (el mínimo real podría
ser mayor si un estilo pondera CV a 0); con el mínimo estructural de 2 es
suficiente para eliminar el caso siempre-imposible sin falsos positivos.

## Archivos afectados

- `src/options.ts`
- `api.md`
- `test/generator.test.ts` (o `test/options.test.ts` si lo creó el punto 02)

## Criterios de aceptación

- [ ] `normalizeOptions({ style: "modern", maxLength: 5, prefix: "AB", suffix: "CD" })` lanza `InvalidOptionsError`.
- [ ] `affixLen === maxLength - 2` sigue siendo válido (p. ej. `maxLength: 6`, prefix "AB", suffix "CD").
- [ ] Tests existentes sin regresiones.
