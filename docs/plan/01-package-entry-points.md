# 01 — Entry points del paquete rotos

**Tipo:** Bug · **Prioridad:** Alta · **Estado:** Pendiente

## Problema

`package.json` apunta `main`, `types` y `exports` a `./dist/index.js`, pero la
compilación genera `dist/src/index.js` porque `tsconfig.json` tiene
`rootDir: "."` (necesario hoy para compilar también `test/`). Cualquier
consumidor de la librería (`import "@graffiti-name-generator/core"`) falla.

## Evidencia (verificada)

```bash
npm run build
node -e "import('./dist/index.js')"   # ERR_MODULE_NOT_FOUND
ls dist                                # -> src/ test/  (no hay dist/index.js)
```

- `package.json:6` → `"main": "./dist/index.js"` (no existe)
- `package.json:7` → `"types": "./dist/index.d.ts"` (no existe)
- `package.json:11-16` → `exports["."]` con las mismas rutas rotas
- `package.json:8-10` → `bin` sí apunta bien a `./dist/src/cli.js`

Problema relacionado: `files: ["dist", "data"]` publica también `dist/test/**`
(tests compilados) en el paquete npm.

## Solución propuesta

Separar el build de publicación del build de tests con dos tsconfigs:

1. `tsconfig.json` (build de publicación): `rootDir: "src"`,
   `include: ["src/**/*"]`, `outDir: "dist"`. La salida pasa a ser
   `dist/index.js`, `dist/cli.js`, etc. — las rutas actuales de
   `main`/`types`/`exports` quedan correctas tal cual.
2. `tsconfig.test.json` (extiende el anterior): `rootDir: "."`,
   `include: ["src/**/*", "test/**/*"]`, `outDir: "dist-test"` (añadir
   `dist-test/` a `.gitignore`).
3. Ajustar scripts en `package.json`:
   - `"build": "tsc"`
   - `"test": "tsc -p tsconfig.test.json && node --test dist-test/test/*.test.js"`
   - `"generate": "node dist/cli.js generate"`
4. Ajustar `bin` a `./dist/cli.js`.
5. Revisar rutas relativas afectadas por el nuevo layout:
   - `src/loader.ts:27-32` (`getDataDir`): con `dist/index.js`, el candidato
     correcto pasa a ser `join(moduleDir, "..", "data")`; mantener la lista de
     candidatos cubriendo ambos layouts o simplificarla.
   - `test/*.test.ts:10-11`: `dataDir` se calcula como `../../data` desde el
     test compilado; verificar que sigue resolviendo desde `dist-test/test/`.
6. `files` deja de incluir tests automáticamente (solo `dist` limpio + `data`).

Alternativa mínima (descartada como solución final, válida como hotfix):
apuntar `main`/`types`/`exports` a `./dist/src/index.js`. No resuelve la
publicación de `dist/test/**`.

## Archivos afectados

- `package.json`
- `tsconfig.json`, `tsconfig.test.json` (nuevo)
- `.gitignore`
- `src/loader.ts` (candidatos de `getDataDir`)
- `test/*.test.ts` (ruta a `data/`)
- `README.md` (sección Development si cambia el flujo)

## Criterios de aceptación

- [ ] `npm run build && node -e "import('./dist/index.js').then(m => console.log(typeof m.generate))"` imprime `function`.
- [ ] `npm pack --dry-run` no incluye ningún archivo de test ni `dist-test/`.
- [ ] `npm test` pasa (19+ tests).
- [ ] `npm run generate -- --style old-school --count 5 --seed 42` produce el golden output actual (TREREX, TROM, SKAK, DRAK, KRIZE).
- [ ] El CLI instalado vía `bin` resuelve `data/` correctamente (probar `node dist/cli.js generate --style modern` desde un cwd distinto a la raíz del repo).
