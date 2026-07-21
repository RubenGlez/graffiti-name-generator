/**
 * Browser entry point. Unlike `index.ts` it registers no data source, since
 * there is no filesystem to read: the host must call `setDataSource()` with
 * bundled data before the first `generate()`.
 */
export { generate } from "./generator.js";
export { setDataSource } from "./loader.js";
export { InvalidOptionsError, MissingDataError, STYLE_IDS } from "./types.js";
export type {
  DataFiles,
  GenerateOptions,
  GenerateResult,
  GeneratedName,
  StyleId,
} from "./types.js";
