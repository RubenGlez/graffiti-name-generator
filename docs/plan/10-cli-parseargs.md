# 10 — CLI: migrar a `util.parseArgs` con modo estricto

**Tipo:** Mejora · **Prioridad:** Baja · **Estado:** Pendiente · **Depende de:** 02, 04

## Problema

El parser artesanal de `src/cli.ts:6-33` tiene varios agujeros:

- **Flags desconocidas se ignoran en silencio**: un typo como `--lenght 6` o
  `--max_length 6` no da error y se aplican los defaults, dando resultados
  confusos sin aviso.
- `--pronounceable` tiene un caso especial (no consume valor) pero
  `--no-pronounceable` va por la rama genérica y puede tragarse el argumento
  siguiente si no empieza por `--`.
- Valores tipo `--pronounceable false` se descartan sin aviso.
- No hay `--help` para el subcomando (`generate --help` intenta generar).

Node ≥ 20 (ya requerido en `engines`) incluye `util.parseArgs` nativo con
`strict: true`, sin dependencias externas.

## Solución propuesta

1. Reemplazar `parseArgs` casero por `util.parseArgs` de `node:util`:
   - `options`: `style`, `count`, `min-length`, `max-length`,
     `preferred-letters`, `forbidden-letters`, `prefix`, `suffix`, `seed`,
     `format` (tipo `string`); `pronounceable` y `no-pronounceable` (tipo
     `boolean`); `help` (boolean, alias `h`).
   - `strict: true` → flags desconocidas lanzan error, que el `catch` de
     `main()` ya convierte en mensaje + exit 1.
2. Manejar `generate --help` mostrando la ayuda.
3. Mutuamente excluyentes `--pronounceable` / `--no-pronounceable`: error si
   se pasan ambas. Si no se pasa ninguna, enviar `undefined` al core (el
   punto 04 hace que aplique el default del estilo).
4. Validar `--format`: valores distintos de `human`/`json` → error (hoy
   cualquier valor desconocido cae a `human` en silencio,
   `src/cli.ts:82-90`).
5. Mantener los nombres de flags actuales (compatibilidad con README/api.md).

## Archivos afectados

- `src/cli.ts`
- `test/` — añadir tests de CLI (ver punto 12; los específicos del parser van aquí):
  ejecutar el binario con `child_process` o extraer `runGenerate`/parser a
  funciones testeables.

## Criterios de aceptación

- [ ] `graffiti-names generate --lenght 6 --style modern` → exit 1 con mensaje de opción desconocida.
- [ ] `graffiti-names generate --style modern --format xml` → exit 1.
- [ ] `graffiti-names generate --help` muestra la ayuda con exit 0.
- [ ] `--pronounceable` y `--no-pronounceable` juntas → exit 1.
- [ ] Todos los ejemplos del README y de `api.md` siguen funcionando tal cual.
