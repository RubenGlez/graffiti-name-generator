# Plan de trabajo — Revisión general del proyecto

Plan derivado de la revisión completa del proyecto (2026-07-05). Cada documento
de este directorio describe un punto de trabajo autocontenido: contexto,
evidencia, solución propuesta, archivos afectados y criterios de aceptación.
Están pensados para poder ejecutarse en sesiones independientes.

## Decisiones ya tomadas

Estas decisiones se consultaron con el propietario del proyecto y **no** deben
re-litigarse al implementar:

1. **Defaults por estilo**: cuando el usuario no pasa `minLength` /
   `maxLength` / `pronounceable`, se aplican los `defaults` del JSON del
   estilo (wildstyle 6–10, minimal 3–5, etc.), como dice `styles.md`.
   Es un cambio de comportamiento menor asumido. Ver `04-defaults-estilo.md`.
2. **Licencia**: MIT. Ver `08-infraestructura.md`.
3. **Formato del plan**: este directorio, un doc por punto.

## Estado y orden de ejecución

| # | Documento | Tipo | Prioridad | Estado | Depende de |
|---|-----------|------|-----------|--------|------------|
| 01 | [Entry points del paquete rotos](./01-package-entry-points.md) | Bug | Alta | Hecho | — |
| 02 | [Validación numérica (NaN)](./02-validacion-numerica.md) | Bug | Alta | Hecho | — |
| 09 | [Refactor: assembler devuelve bloques reales](./09-refactor-assembler.md) | Mejora | Alta | Hecho | — |
| 03 | [Clusters en fronteras de affix](./03-clusters-affix.md) | Bug | Alta | Hecho | 09 (recomendado) |
| 04 | [Defaults por estilo](./04-defaults-estilo.md) | Gap | Media | Hecho | 02 |
| 05 | [Datos muertos en configuración](./05-datos-muertos.md) | Gap | Media | Hecho | — |
| 06 | [Patrón CCVCC idéntico a CCVC](./06-patron-ccvcc.md) | Gap | Media | Hecho | 09 |
| 07 | [Off-by-one en validación de affix](./07-affix-off-by-one.md) | Gap | Baja | Hecho | — |
| 08 | [Infraestructura: CI, LICENSE, linter](./08-infraestructura.md) | Mejora | Media | Hecho | 01 |
| 10 | [CLI con util.parseArgs](./10-cli-parseargs.md) | Mejora | Baja | Pendiente | 02 |
| 11 | [Robustez del loader](./11-loader-robustez.md) | Mejora | Baja | Pendiente | — |
| 12 | [Cobertura de tests](./12-cobertura-tests.md) | Mejora | Media | Pendiente | 01–07 |
| 13 | [Limpiezas menores y docs](./13-limpiezas-menores.md) | Mejora | Baja | Pendiente | — |

### Fases sugeridas

- **Fase 1 — Bugs verificados**: 01, 02, 09, 03. El refactor 09 se adelanta
  porque hace trivial la corrección de 03 (y de 06).
- **Fase 2 — Gaps spec/código**: 04, 05, 06, 07. La fase 2 toca datos y
  semántica; 04 cambia output por defecto, así que conviene hacerla junta y
  actualizar docs de una vez.
- **Fase 3 — Mejoras**: 08, 10, 11, 12, 13. La CI (08) conviene tenerla antes
  de la fase 3 restante para que proteja los cambios.

### Convenciones al implementar

- Cada punto se implementa con sus propios tests (los criterios de aceptación
  de cada doc lo detallan); el doc 12 recoge la cobertura transversal restante.
- Al cerrar un punto: actualizar su columna **Estado** en esta tabla
  (`Pendiente` → `Hecho (commit abc1234)`) y marcar los checkboxes del doc.
- Cualquier cambio de comportamiento visible debe reflejarse en `README.md`,
  `api.md` y el resto de specs afectadas en el mismo commit.
- El golden test de `test/generator.test.ts` (seed 42) solo debe cambiar si el
  punto lo justifica explícitamente (04 y 06 pueden hacerlo; el doc lo indica).
