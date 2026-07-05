# 08 — Infraestructura: CI, LICENSE, linter/formatter

**Tipo:** Mejora · **Prioridad:** Media · **Estado:** Hecho · **Depende de:** 01 (scripts de build/test estables)

**Decisión tomada por el propietario:** licencia **MIT**.

## Problema

El repo no tiene CI, licencia, ni tooling de calidad de código:

- Ningún workflow en `.github/workflows/` — nada ejecuta build+test en push/PR.
- Sin `LICENSE` ni campo `license` en `package.json`.
- Sin ESLint/Prettier ni opciones estrictas extra de tsc; hay síntomas que un
  linter habría cazado (variable `slots` sin uso en `src/filters.ts:86`).

## Solución propuesta

1. **CI — `.github/workflows/ci.yml`:**
   - Trigger: `push` a `main` y `pull_request`.
   - Node 20 y 22 (matriz), `npm ci`, `npm run build`, `npm test`, lint.
   - Cache de npm vía `actions/setup-node`.
2. **LICENSE:** archivo MIT estándar (copyright: Rubén González, año en
   curso) + `"license": "MIT"` en `package.json`.
3. **Linter/formatter:**
   - ESLint 9 (flat config) con `typescript-eslint` (preset
     `strictTypeChecked` o `recommendedTypeChecked`) + Prettier.
   - Scripts: `"lint": "eslint ."`, `"format": "prettier --write ."`,
     `"format:check": "prettier --check ."`.
   - Endurecer `tsconfig.json`: `noUnusedLocals`, `noUnusedParameters`,
     `noUncheckedIndexedAccess` (revisar los accesos indexados existentes:
     `src/rng.ts:40`, `src/cli.ts`, loaders de datos — corregir lo que aflore).
   - Corregir los hallazgos del primer lint (mínimo: `slots` sin uso).
4. Añadir `.editorconfig` básico (2 espacios, LF, UTF-8).

## Archivos afectados

- `.github/workflows/ci.yml` (nuevo)
- `LICENSE` (nuevo), `package.json`
- `eslint.config.js`, `.prettierrc`, `.editorconfig` (nuevos)
- `tsconfig.json`
- Código fuente que aflore con las reglas nuevas

## Criterios de aceptación

- [x] Workflow `.github/workflows/ci.yml` (lint + format:check + build + test en Node 20 y 22); secuencia completa verificada en local.
- [x] `LICENSE` MIT presente y `package.json.license === "MIT"`.
- [x] `npm run lint` y `npm run format:check` pasan limpios en el repo.
- [x] `tsc` con `noUnusedLocals`/`noUnusedParameters`/`noUncheckedIndexedAccess` compila sin errores.
- [x] Hallazgos del primer lint corregidos: import `NormalizedOptions` sin usar en assembler y parámetro muerto `core` en `checkCandidate` (la variable `slots` ya la eliminó el punto 09).
- [x] Prettier configurado (excluye markdown de prosa); `.editorconfig` añadido.
