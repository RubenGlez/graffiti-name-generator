# 13 — Limpiezas menores y correcciones de documentación

**Tipo:** Mejora · **Prioridad:** Baja · **Estado:** Hecho

Cajón de sastre de hallazgos menores de la revisión. Cada ítem es
independiente; pueden hacerse en un único commit.

## Código

1. **Re-export innecesario de `createRng`** en `src/assembler.ts:80` — el
   assembler lo importa solo para re-exportarlo y nadie lo consume desde ahí
   (generator importa de `./rng.js`). Eliminar import y re-export.
   *(Puede haberlo hecho ya el punto 09 — verificar.)*
2. **Variable muerta `slots`** en `src/filters.ts:86` — desaparece con el
   punto 09; si 09 se pospone, eliminarla aquí.

## Documentación

3. **Ejemplos incorrectos en `phonetic-system.md`** (tabla "Assembly
   examples"):
   - `SKONE` usa un ending `NE` que no existe en `data/blocks.json:endings`;
   - `STORK` es palabra del diccionario (`data/dictionary-en.txt`) y sería
     rechazada por el filtro.
   Reemplazar por ejemplos generables reales (p. ej. tomados de un run con
   seed fija: KRAZE, VESK, TRAIX sí son válidos).
4. **Documentar la limitación Scunthorpe del blocklist** en
   `filters-and-wordlists.md`: el matching es por substring
   (`src/filters.ts:133-138`), así que ningún nombre puede contener `HELL`,
   `ASS`, etc., aunque el conjunto sea inocuo (KASSER, SHELLK…). Es un
   trade-off aceptado del MVP; dejarlo escrito con un ejemplo y la posible
   evolución (matching por palabra/fonema) como no-objetivo actual.
5. **`api.md` — ejemplo de salida de librería** (`// e.g. ["KRAZE", "SKONE",
   ...]`): SKONE no es generable (ver ítem 3); usar salida real de un seed.
6. **README** — revisar tras los puntos 04 y 06: tabla de opciones
   (defaults por estilo) y ejemplos de patrón (`TROM (pattern: CCVCC)`).
   Esos puntos ya lo actualizan; aquí solo verificar coherencia final de los
   tres documentos (README, api.md, styles.md) entre sí.

## Datos

7. **Blocklist**: revisar términos de una letra de riesgo de falso positivo
   alto ya presentes (p. ej. `ass` bloquea cualquier `...ASS...`). No se
   cambia el mecanismo (ver ítem 4), pero sí se puede valorar retirar
   términos de ratio señal/ruido muy bajo como `hell` (bloquea `SHELL*`,
   `HELLER*`) si el propietario lo aprueba — **preguntar antes de tocar el
   blocklist**; ante la duda, dejarlo como está y solo documentar.

## Criterios de aceptación

- [x] `grep -rn "createRng" src/assembler.ts` no devuelve nada (import y re-export eliminados; la variable `slots` ya la quitó el punto 09).
- [x] Ejemplos de `phonetic-system.md` (arreglados en 06) y `api.md` (arreglados aquí) usan salidas reales generables. `scoring.md` conserva KRAZE/SKONE/VESK **a propósito**: ilustran la función de scoring pura (verificados por `scorer.test.ts`), no output de generación.
- [x] `filters-and-wordlists.md` documenta el matching por substring y el problema Scunthorpe con ejemplos.
- [x] README, api.md y styles.md coherentes entre sí tras 04/06.
- [x] Build, lint y tests en verde (66 tests).

**Nota sobre el blocklist (ítem 7):** en la primera pasada se dejó intacto
pendiente de aprobación. Estado final acordado con el propietario. **Desbloqueado** (permitido en
nombres): palabras suaves no-insulto `hell`, `damn`, `crap`, `bloody`, `bugger`
y el término muy corto `ass` (recupera falsos positivos tipo BRASS/CLASS/
KASSER; `asshole` sigue bloqueado por su propia entrada).

**Bloqueado:** slurs, profanidad fuerte **e insultos** —incluidos los leves
`jerk`, `moron`, `jackass`, `douche` (el propietario decidió mantenerlos
bloqueados)— además de `fuck`, `cunt`, `nigger`, `faggot`, `bitch`, `shit`,
`whore`, `retard`, `prick`, `pussy`, `cock`, `dick`, `bastard`, `nazi`, `slut`,
`twat`, `wanker`, `bollocks`, `bullshit`, `piss`, `fag`. El encabezado de
`data/blocklist.txt` documenta el alcance.
