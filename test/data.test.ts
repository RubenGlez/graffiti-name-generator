import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadData } from "../src/loader.js";
import { setDataDir } from "../src/loader-node.js";
import { STYLE_IDS } from "../src/types.js";
import type { BlocksConfig } from "../src/types.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(testDir, "..", "..", "data");

const POOLS: (keyof BlocksConfig)[] = [
  "starts",
  "nuclei",
  "endings",
  "bridges",
];

describe("data coherence", () => {
  before(() => {
    setDataDir(dataDir);
  });

  it("every style block weight key exists in the master block list", () => {
    const data = loadData();

    for (const id of STYLE_IDS) {
      const style = data.styles.get(id)!;
      for (const pool of POOLS) {
        const master = new Set(data.blocks[pool]);
        const weights = style.blocks[pool] ?? {};
        for (const key of Object.keys(weights)) {
          assert.ok(
            master.has(key),
            `style "${id}" pool "${pool}" references unknown block "${key}"`,
          );
        }
      }
    }
  });

  it("every cluster entry is a pure consonant sequence", () => {
    const data = loadData();
    for (const cluster of data.clusters) {
      assert.match(
        cluster,
        /^[BCDFGHJKLMNPQRSTVWXYZ]+$/,
        `cluster "${cluster}" contains a non-consonant`,
      );
    }
  });

  it("every style references only defined patterns", () => {
    const data = loadData();
    for (const id of STYLE_IDS) {
      const style = data.styles.get(id)!;
      for (const patternId of Object.keys(style.patterns)) {
        assert.ok(
          data.patterns[patternId],
          `style "${id}" references unknown pattern "${patternId}"`,
        );
      }
    }
  });
});
